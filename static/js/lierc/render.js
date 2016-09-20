var Render = function(message, force_raw) {
  if (force_raw) return raw(message);
  switch (String(message.Command)) {
  case "NICK":
    var old = message.Prefix.Name;
    var nick = message.Params[0];
    message.Prefix.Name = nick;
    return make("event", message).append(
      make_text(old + " is now known as "),
      make_nick(message)
    );

  case "PART":
    var nick = message.Prefix.Name;
    var name = message.Params[0];
    var msg = message.Params[1];
    return make("event", message).append(
      make_nick(message),
      ' has left' + (msg ? " ("+msg+")" : ""));

  case "QUIT":
    var nick = message.Prefix.Name;
    var msg = message.Params[0];
    return make("event", message).append(
      make_nick(message),
      ' has quit' + (msg ? " ("+msg+")" : ""));

  case "JOIN":
    var name = message.Params[0];
    var nick = message.Prefix.Name;
    return make("event", message).append(
      make_nick(message),
      make_text(' has joined the channel')
    );

  case "332":
    var name = message.Params[1];
    var text = message.Params[2];

    var span = $('<span/>').append(
      make_text("Topic: "),
      Format(text)
    );

    linkify(span.get(0));
    return make("event", message).append(span);

  case "TOPIC":
    var nick = message.Prefix.Name;
    var name = message.Params[0];
    var text = message.Params[1];

    var span = $('<span/>').append(
      make_nick(message),
      make_text(" changed the topic: "),
      Format(text)
    );

    linkify(span.get(0));
    return make("event", message).append(span);

  case "PRIVMSG":
    var nick = message.Prefix.Name;
    var name = message.Params[0];
    var text = message.Params[1];

    if (!name.length || !text.length)
      return raw(message);

    var from = make_nick(message);
    var color = string_to_color(message.Prefix.User || nick);
    var msg = $('<span/>', {'class':'message-text'});
    from.css({'color': color});

    if (text.substring(0, 1) == "\x01") {
      if (text.substring(1,7) == "ACTION") {
        from.text('* ' + nick + ' ');
        msg.append(Format(text.substring(7)));
      }
      else {
        return;
      }
    }
    else {
      from.text('< '+nick+'> ');
      msg.append(Format(text));
    }

    linkify(msg.get(0));

    var hash = md5(message.Raw);

    return make("message", message).append(
      flex(from, msg, timestamp(message))
    ).attr('data-message-hash', hash);

  case "NOTICE":
    var name = message.Prefix.Name;
    var text = message.Params[1];

    var chan = $('<span/>', {'class':'channel'}).text(name);
    var span = $('<span/>').text(' ').append(Format(text));
    linkify(span.get(0));

    return make("raw notice", message).append(chan, span);

  default:
    return raw(message);
  };

  function make_text(text) {
    return $('<span/>').text(text);
  }

  function make_nick(message) {
    var nick = $('<span/>', {
      'class': 'message-nick',
      'data-nick': message.Prefix.Name,
      'data-user': message.Prefix.User,
      'data-server': message.Prefix.Server
    }).text(message.Prefix.Name);

    if (message.Prefix.User && message.Prefix.Server) {
      var title = message.Prefix.Name
        + "!" + message.Prefix.User
        + '@' + message.Prefix.Server;
      nick.attr('title', title);
    }
    return nick;
  }

  function raw (message) {
    var text = "";

    if (message.Command.match(/^[45][0-9][0-9]$/))
      text = message.Params.join(" ");
    else if (message.Command.match(/^[0-9][0-9][0-9]$/))
      text = message.Params.slice(1).join(" ");
    else
      text = [message.Prefix.Name, message.Command].concat(message.Params).join(" ");

    return make("raw", message).text(text);
  }

  function timestamp (message) {
    var date = new Date(message.Time * 1000);
    var h = String(date.getHours());
    if (h.length < 2)
      h = "0" + h;
    var m = String(date.getMinutes());
    if (m.length < 2)
      m = "0" + m;

    return $('<time/>', {
      'data-time': message.Time,
      'title': date.toString()
    }).text(h + ":" + m);
  }

  function make (type, message) {
    return $('<li/>', {
      'class': ["chat", type, message.Command.toLowerCase()].join(" "),
      'data-message-id': message.Id
    });
  }

  function flex () {
    var wrap = $('<div/>',{'class':'message-flex'});
    for (var i=0; i < arguments.length; i++) {
      wrap.append(arguments[i]);
    }
    return wrap;
  }

  function string_to_color(str){
    var colors = [
      "MediumVioletRed",
      "PaleVioletRed",
      "DeepPink",
      "HotPink",
      "Red",
      "DarkRed",
      "FireBrick",
      "Crimson",
      "IndianRed",
      "Orange",
      "DarkOrange",
      "Coral",
      "Tomato",
      "OrangeRed",
      "Maroon",
      "Brown",
      "Sienna",
      "SaddleBrown",
      "Chocolate",
      "Peru",
      "DarkGoldenrod",
      "Goldenrod",
      "MidnightBlue",
      "MediumBlue",
      "Blue",
      "RoyalBlue",
      "SteelBlue",
      "CornflowerBlue",
      "DodgerBlue",
      "DeepSkyBlue",
      "LightSkyBlue",
      "SkyBlue",
      "MediumSlateBlue",
      "SlateBlue",
      "DarkSlateBlue",
      "Indigo",
      "Purple",
      "DarkMagenta",
      "DarkOrchid",
      "DarkViolet"
    ];

    var c = 0;
    var m = colors.length;

    for (var i = 0; i < str.length; i++) {
      c = ((c << 5) + str.charCodeAt(i)) % m
    }

    return colors[c];
  }
};

var url_re = /(https?:\/\/[^\s<"]*)/ig;

function linkify(elem) {
  var children = elem.childNodes;
  var length = children.length;

  for (var i=0; i < length; i++) {
    var node = children[i];
    if (node.nodeName == "A") {
      continue;
    }
    else if (node.nodeName != "#text") {
      linkify(node);
    }
    else if (node.nodeValue.match(url_re)) {
      var span = document.createElement("SPAN");
      var escaped = $('<div/>').text(node.nodeValue).html();
      span.innerHTML = escaped.replace(
        url_re, '<a href="$1" target="_blank" rel="noreferrer">$1</a>');
      node.parentNode.replaceChild(span, node);
    }
  }
}

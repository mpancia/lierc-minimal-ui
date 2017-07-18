class Auth {
  constructor (baseurl) {
    this.baseurl = baseurl
  }

  auth (complete) {
    fetch(this.baseurl + '/auth', {
      'credentials': 'same-origin'
    }).then( res => {
      if (!res.ok) { throw Error(res.statusText) }
      return res.json()
    }).then( res => {
      complete(res)
    }).catch( e => {
      console.log(e)
      modal_overlay(complete)
    })
  }

  modal_overlay (complete) {
    var dialog = new Dialog('login')
    var overlay = dialog.el
    dialog.append(document.body)

    if (!('ontouchstart' in document.documentElement)) {
      overlay.querySelector('.login-form input[name="email"]').focus()
    }

    overlay.addEventListener('submit', e => {
      e.preventDefault()
      var action = e.target.querySelector('input[type="submit"]').getAttribute('name')
      var email = e.target.querySelector('input[name="email"]').value
      var pass = e.target.querySelector('input[type="password"]').value

      var body = ''
      body += 'email=' + encodeURIComponent(email)
      body += '&pass=' + encodeURIComponent(pass)

      if (action == 'register') {
        var user = e.target.querySelector('input[name="username"]').value
        body += '&username=' + encodeURIComponent(user)
      }

      fetch(this.baseurl + '/' + action, {
        'credentials': 'same-origin',
        'method': 'POST',
        'body': body,
        'headers': {
          'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
        }
      }).then( res => {
        if (!res.ok) { throw Error(res.statusText) }
        return res.json()
      }).then( res => {
        dialog.close()
        complete(res)
      }).catch( e => {
        alert('Sorry: ' + e)
      })
    })

    overlay.querySelector('.login-toggle').addEventListener('click', e => {
      e.preventDefault()
      overlay.querySelector('.login-wrap').style.display = 'block'
      overlay.querySelector('.reset-wrap').style.display = 'none'
      overlay.querySelector('.login-form input[name="email"]').focus()
    })

    overlay.querySelector('.reset-toggle').addEventListener('click', e => {
      e.preventDefault()
      overlay.querySelector('.login-wrap').style.display = 'none'
      overlay.querySelector('.reset-wrap').style.display = 'block'
      overlay.querySelector('.reset-wrap input[name="email"]').focus()
    })
  };
}

(function (window) {
  var utils = {
    xhr: function (url, callback) {
      var xmlhttp = new window.XMLHttpRequest()

      xmlhttp.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
          try {
            var json = JSON.parse(this.responseText)
            callback(null, json)
          } catch (err) {
            callback(err)
          }
        } else {

        }
      }

      xmlhttp.open('GET', url, true)
      xmlhttp.send()
    }
  }

  // "Flood" represents the global namespace for
  // client-side javascript across all our pages
  window.Flood = {
    utils: utils
  }
})(window)

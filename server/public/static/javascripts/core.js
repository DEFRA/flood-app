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
    },
    forEach: function (items, callback) {
      for (var i = 0; i < items.length; i++) {
        callback.call(items, items[i], i)
      }
    }
  }

  // "flood" represents the global namespace for
  // client-side javascript across all our pages
  window.flood = {
    utils: utils
  }
})(window)

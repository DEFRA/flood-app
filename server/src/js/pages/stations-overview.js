import $ from 'jquery'
import 'datatables.net-dt'
import 'datatables.net-buttons'
import 'datatables.net-buttons/js/buttons.html5.js'
window.jQuery = $
window.$ = $

$(document).ready(function () {
  $('#stations-overview').DataTable({
    dom: 'lBfrtip',
    buttons: [{
      extend: 'csv',
      text: 'Export as csv',
      filename: 'stations-overview-' + new Date().toISOString(),
      exportOptions: {
        modifier: {
          search: 'none'
        },
        format: {
          header: (data, row, column, node) => {
            if (data.indexOf('<select>') > -1) {
              data = data.match(/(?<=">)(.*?)(?=<\/option>)/g)[0] || data
            }
            return data
          }
        }
      }
    }],
    initComplete: function () {
      this.api().columns().every(function () {
        const column = this
        const noSelect = [
          'rloi_id',
          'telemetry_id',
          'wiski_id',
          'agency_name',
          'parameter',
          'units',
          'value',
          'processed_value',
          'value_timestamp',
          'age',
          'percentile_5',
          'percentile_95'
        ]
        if (noSelect.indexOf(column.header().innerHTML) === -1) {
          const select = $('<select><option value="" style="font-weight:800">' + column.header().innerHTML + '</option></select>')
            .appendTo($(column.header()).empty())
            .on('change', function () {
              const val = $.fn.dataTable.util.escapeRegex(
                $(this).val()
              )
              column
                .search(val ? '^' + val + '$' : '', true, false)
                .draw()
            })

          column.data().unique().sort().each(function (d, j) {
            select.append('<option value="' + d + '">' + d + '</option>')
          })
        }
        return null
      })
      $('#loading').addClass('off-screen')
      $('#stations-overview').removeClass('off-screen')
      // After processing adjust body to match table
      $('body').width($('table').width() + 30)

      // wrap top controls
      $('.dataTables_length, .dt-buttons, .dataTables_filter').wrapAll('<div class="top-controls" />')
      // wrap bottom controls
      $('.dataTables_info, .dataTables_paginate').wrapAll('<div class="bottom-controls" />')
    }
  })
})

// Graph component
var Graph = (function(window,d3) {

    //
    // Private properties
    //

    var yExtension = 0.4,
        windowBreakPoint = 640,
        svgBreakPoint = 576,
        xCutOff = 9,
        toolTipBgPath = 'm0,0 l124,0 l0,62 l-52,0 l-10,15 l-10,-15 l-52,0 l0,-62',
        toolTipBgPathLeft = 'm0,0 l124,0 l0,62 l-94,0 l-25,12 l5,-12 l-10,0 l0,-62',
        toolTipBgPathRight = 'm0,0 l124,0 l0,62 l-10,0 l5,12 l-25,-12 l-94,0 l0,-62'

    var svg,
        data,
        x, y, 
        xAxis, yAxis, 
        dim, 
        chartWrapper, 
        line, area, path, 
        margin = {}, 
        locator, locatorX, locatorY,
        toolTip, toolTipX, toolTipY,
        now, timeX,
        width, height,
        parentWidth, parentHeight,
        hasObserved = false, hasForecast = false, hasHighest = false, hasWarning = false, hasAlert = false,
        parseTime, parseDate,
        latestLevel, latestDate,
        dataPoint, dataPointLatest

    var _options

    //
    // Public methods
    //
    
    var init = function (options) {

        //
        // Options
        //

        var defaults = {
            data: ''
        }
        _options = Object.assign({}, defaults, options)

        //
        // Map to DOM container elements
        //

        //
        // Load json and setup
        //

        d3.json(_options.data, setup)

    }

    //
    // Private methods
    //

    var setup = function (json) {

        // Set data object
        data = json

        // Setup array to combine observed and forecast points
        // and identify startPoint for locator 
        lines = []
        if (data.observed) {
            lines = lines.concat(data.observed)
            dataPoint = JSON.parse(JSON.stringify(data.observed[data.observed.length-1]))
            hasObserved = true
        }
        if (data.forecast) {
            lines = lines.concat(data.forecast)
            dataPoint = JSON.parse(JSON.stringify(data.forecast[0]))
            hasForecast = true
        }

        // Set dataPointLatest
        dataPointLatest = JSON.parse(JSON.stringify(dataPoint))
    
        // Initialize scales
        xExtent = d3.extent(lines, function(d,i) { return new Date(d.date) })
        yExtent = d3.extent(lines, function(d,i) { return d.level })

        // Set Y range to highest and lowest values from the data
        yRange = [yExtent[0],yExtent[1]]
        if (data.highest) { 
            yRange.push(data.highest)
            hasHighest = true
        }
        if (data.warning) { 
            yRange.push(data.warning)
            hasWarning = true
        }
        if (data.alert) { 
            yRange.push(data.alert)
            hasAlert = true
        }
        yExtent[0] = Math.min.apply(Math,yRange)
        yExtent[1] = Math.max.apply(Math,yRange)

        // Increase X range when ther is no forecast data and a now value
        if (!hasForecast && data.now) {
            xRange = [xExtent[0],xExtent[1]]
            xRange.push(new Date(data.now))
            xExtent[0] = Math.min.apply(Math,xRange)
            xExtent[1] = Math.max.apply(Math,xRange)
        }

        // Add margin to bottom of Y Axis
        yExtent[0] = ((yExtent[0] * 100) - (yExtension * 100))/100

        // Add margin to top of Y Axis
        yExtent[1] = ((yExtent[1] * 100) + (yExtension * 100))/100

        // Setup scales
        x = d3.time.scale().domain(xExtent)
        y = d3.scale.linear().domain(yExtent)

        // Bisect date
        bisectDate = d3.bisector(function(d) { return new Date(d.date) }).left

        // Initialize axis
        xAxis = d3.svg.axis().orient('bottom').outerTickSize(0)
        yAxis = d3.svg.axis().orient('left').ticks(5).tickFormat(function(d) { 
            return parseFloat(d).toFixed(1) + 'm'
        }).outerTickSize(0)

        // Area generator
        area = d3.svg.area()
        .interpolate('cardinal')
        .x(function(d) { return x(new Date(d.date)) })
        .y0(function(d) { return height })
        .y1(function(d) { return y(d.level) })

        // Line generator
        line = d3.svg.line()
        .interpolate('cardinal')
        .x(function(d) { return x(new Date(d.date)) })
        .y(function(d) { return y(d.level) })

        // Initialize svg
        svg = d3.select('#graph').append('svg').style('pointer-events', 'none')
        chartWrapper = svg.append('g').style('pointer-events', 'all')
        chartWrapper.append('g').classed('bands', true)
        chartWrapper.append('g').classed('y grid', true)
        chartWrapper.append('g').classed('x grid', true)
        chartWrapper.append('g').classed('x axis', true)
        chartWrapper.append('g').classed('y axis', true)
        if (hasObserved) {
            chartWrapper.append('g').classed('observed observed-focus', true)
            //observedArea = svg.select('.observed').append('path').datum(data.observed).classed('observed-area', true)
            observed = svg.select('.observed').append('path').datum(data.observed).classed('observed-line', true)
        }
        normalBand = svg.select('.bands').append('rect').classed('normal-band', true)
        if (hasAlert) {
            alertBand = svg.select('.bands').append('rect').classed('alert-band', true)
        }
        if (hasWarning) {
            warningBand = svg.select('.bands').append('rect').classed('warning-band', true)
            //svg.select('.bands').append('line').classed('warning', true);
        }
        if (hasForecast) {
            chartWrapper.append('g').classed('forecast', true)
            forecast = svg.select('.forecast').append('path').datum(data.forecast).classed('forecast-line', true)
        }
        
        // Add timeline
        if(data.now) {
            chartWrapper.append('g').classed('time', true)
            now = svg.select('.time')
            svg.select('.time').append('line').classed('time-line', true)
            svg.select('.time').append('text').classed('time-now', true).text('Now')
        }

        // Add thresholds
        if(hasHighest) {
            chartWrapper.append('g').classed('thresholds', true)
            svg.select('.thresholds').append('line').classed('highest', true)
        }

        // Add locator
        locator = chartWrapper.append('g').classed('locator', true)
        locatorPoint = locator.append('circle').attr('r', 4.5).classed('locator-point', true)
        
        // Set level and date formats
        parseTime = d3.time.format.utc('%-I:%M%p')
        parseDate = d3.time.format.utc('%e %b %Y')
        parseDateShort = d3.time.format.utc('%e %b')

        // Add tooltip
        toolTip = chartWrapper.append('g').classed('tool-tip', true)
        toolTipBg = toolTip.append('path').attr('d',toolTipBgPath).classed('tool-tip-bg', true)
        toolTipLevel = toolTip.append('text').attr({'x': 10,'y':27}).classed('tool-tip-level', true).text(
            Number(dataPoint.level).toFixed(2) + 'm'
        )
        toolTipDate = toolTip.append('text').attr({'x': 10,'y':47}).classed('tool-tip-date', true).text(
            parseTime(new Date(dataPoint.date)).toLowerCase()
                + ', '
                + parseDateShort(new Date(dataPoint.date)
            )
        )

        // Add click event
        chartWrapper.on('click', click)

        // Event listeners
        window.addEventListener('resize', render)

        // Render the chart
        render()

    }

    function render() {

        updateDimensions()

        // Update svg elements to new dimensions
        chartWrapper.attr('transform', 'translate(' + (margin.left + margin.right) + ',' + 0 + ')')

        // Update the axis and line
        xAxis.scale(x)
        yAxis.scale(y)
        svg.select('.x.axis').attr('transform', 'translate(0,' + height + ')').call(xAxis)
        svg.select('.y.axis').call(yAxis)

        // Update grid lines
        /*
        svg.select('.x.grid')
        .attr('transform', 'translate(0,' + height + ')')
        .call(d3.svg.axis()
            .scale(x)
            .orient('bottom')
            .ticks(d3.time.day,1)
            .tickSize(-height, 0, 0)
            .tickFormat('')
        )
        svg.select('.y.grid')
        .attr('transform', 'translate(0,' + 0 + ')')
        .call(d3.svg.axis()
            .scale(y)
            .orient('left')
            .ticks(5)
            .tickSize(-width, 0, 0)
            .tickFormat('')
        )
        */

        // Update bands and thresholds
        if (hasHighest) {
            svg.select('.highest').attr('transform', 'translate(0,' + y(data.highest) + ')').attr('x2', x(xExtent[1])).attr('y2', 0)
        }
        if (hasWarning) {
            warningBand.attr({'x':x(xExtent[0]),'y':y(yExtent[1]),'width':x(xExtent[1]),'height':y(data.warning)})
        }
        if (hasAlert) {
            alertBand.attr({'x':x(xExtent[0]),'y':y(yExtent[1]),'width':x(xExtent[1]),'height':y(data.alert)})
        }
        normalBand.attr({'x':x(xExtent[0]),'y':y(yExtent[1]),'width':x(xExtent[1]),'height':y(yExtent[0])})

        // Update time line
        if (data.now) {
            timeX = Math.floor(x(new Date(data.now)))
            svg.select('.time-line').attr('y1', 0).attr('y2', height)
            svg.select('.time-now').attr('x', -17).attr('y', -6)
            now.attr('y1', 0).attr('y2', height)	
                .attr('transform', 'translate(' + timeX + ',0)')				
            // Add 'today' class to x axis tick
            svg.selectAll('.x .tick')
                .filter(function(d){ 
                    return new Date(d).getDay() == new Date(data.now).getDay() && new Date(d).getUTCHours() == 12
                })
                .attr('class', 'tick tick-today')
        }

        // Draw lines and areas
        if (hasObserved) {
            observed.attr('d', line)
        }
        if (hasForecast) {
            forecast.attr('d', line)
        }

        // Set locator position
        locator.attr('transform', 'translate(' + locatorX + ',' + locatorY + ')')

        // Set tooltip position 
        toolTip.attr('transform', 'translate(' + toolTipX + ',' + toolTipY + ')')

    }

    function updateDimensions() {

        margin.top = 25
        margin.bottom = 25
        margin.left = 18
        margin.right = 18

        xCutOffLeft = d3.time.hour.offset(xExtent[0], + xCutOff).getTime()
        xCutOffRight = d3.time.hour.offset(xExtent[1], - xCutOff).getTime()

        // Get dimensions based on parent size
        parentWidth = Math.floor(d3.select('#graph').node().getBoundingClientRect().width)
        parentHeight = Math.floor(d3.select('#graph').node().getBoundingClientRect().height)

        // Mobile first
        xAxis.ticks(d3.time.hour.utc, 12).tickFormat(function(d) {
            if (d.getUTCHours() == 12 & d >= xCutOffLeft & d <= xCutOffRight) {
                formatter = d3.time.format('%-e/%-m')
                return formatter(d)
            } else {
                return null
            }
        })

        // Greater than window or svg breakpoint
        if(window.innerWidth > windowBreakPoint && parentWidth > svgBreakPoint) {
            xAxis.ticks(d3.time.hour.utc, 12).tickFormat(function(d) {
                if (d.getUTCHours() == 12 & d.getTime() >= xCutOffLeft & d.getTime() <= xCutOffRight) {
                    formatter = d3.time.format('%a, %e %b')
                    return formatter(d)
                } else {
                    return null
                }
            })
            margin.left = 21
            margin.right = 21
        }
        width = parentWidth - margin.left - margin.right
        height = parentHeight - margin.top - margin.bottom

        // Update x and y scales to new dimensions
        x.range([0, width])
        y.range([height, 0])

        // Update locator position
        locatorX = Math.floor(x(new Date(dataPoint.date)))
        locatorY = Math.floor(y(dataPoint.level))

        // Update tooltip position
        updateToolTipPosition()

    }

    function updateToolTipPosition() {

        if (locatorX - toolTipBg.node().getBBox().width < 10) {
            // Tool tip on the left
            toolTipX = locatorX + 5
            toolTipBg.attr('d',toolTipBgPathLeft)
        } else {
            // Tool tip on the right
            toolTipX = locatorX - toolTipBg.node().getBBox().width - 5
            toolTipBg.attr('d',toolTipBgPathRight)
        }
        toolTipY = locatorY - toolTipBg.node().getBBox().height - 8

    }

    function click() {

        var x0 = x.invert(d3.mouse(this)[0]),
        i = bisectDate(lines, x0, 1)
        d0 = lines[i - 1]
        d1 = lines[i]

        d = x0 - new Date(d0.date) > new Date(d1.date) - x0 ? d1 : d0
        dataPoint.date = d.date
        dataPoint.level = d.level

        locatorX = Math.floor(x(new Date(dataPoint.date)))
        locatorY = Math.floor(y(dataPoint.level))
        latestX = Math.floor(x(new Date(dataPointLatest.date)))

        // Update figcaption data

        if (locatorX > latestX) {
            locatorPoint.classed('locator-point-forecast', true)
        } else {
            locatorPoint.classed('locator-point-forecast', false)
        }

        // Update locator point
        locator.attr('transform', 'translate(' + locatorX + ',' + locatorY + ')')

        // Update tooltip content, position and visibiliy
        updateToolTipPosition()

        toolTipY = locatorY - toolTipBg.node().getBBox().height - 10
        toolTipLevel.html(Number(dataPoint.level).toFixed(2) + 'm')
        toolTipDate.html(
            parseTime(new Date(dataPoint.date)).toLowerCase()
            + ', '
            + parseDateShort(new Date(dataPoint.date)
        ))
        toolTip.attr('transform', 'translate(' + toolTipX + ',' + toolTipY + ')')

    }

    return {
        init: init
    }

})(window,d3)
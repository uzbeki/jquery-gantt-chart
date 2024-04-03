/**
 * @license MIT
 * @version 0.2.2
 * @name jQuery Gantt Chart
 * @description jQuery Gantt Chart is a simple chart that implements gantt functionality as a jQuery component.
 * @author Bekhruz Otaev
 * @link https://github.com/uzbeki/jquery-gantt-chart/
 */
(function ($, undefined) {
  "use strict";

  var UTC_DAY_IN_MS = 24 * 60 * 60 * 1000; // Number of milliseconds in a day

  // Date prototype helpers
  // ======================

  // `getWeekId` returns a string in the form of 'dh-YYYY-WW', where WW is
  // the week # for the year.
  // It is used to add an id to the week divs
  Date.prototype.getWeekId = function () {
    var y = this.getFullYear();
    var w = this.getWeekOfYear();
    var m = this.getMonth();
    if (m === 11 && w === 1) {
      y++;
    } else if (!m && w > 51) {
      y--;
    }
    return "dh-" + y + "-" + w;
  };

  // `getRepDate` returns the milliseconds since the epoch for a given date
  // depending on the active scale
  Date.prototype.getRepDate = function (scale) {
    switch (scale) {
      case "hours":
        return this.getTime();
      case "weeks":
        return this.getDayForWeek().getTime();
      case "months":
        return new Date(this.getFullYear(), this.getMonth(), 1).getTime();
      case "days":
      /* falls through */
      default:
        return this.getTime();
    }
  };

  // `getDayOfYear` returns the day number for the year
  Date.prototype.getDayOfYear = function () {
    var year = this.getFullYear();
    return (Date.UTC(year, this.getMonth(), this.getDate()) - Date.UTC(year, 0, 0)) / UTC_DAY_IN_MS;
  };

  // Use ISO week by default
  //TODO: make these options.
  var firstDay = 1; // ISO week starts with Monday (1); use Sunday (0) for, e.g., North America
  var weekOneDate = 4; // ISO week one always contains 4 Jan; use 1 Jan for, e.g., North America

  // `getWeekOfYear` returns the week number for the year
  //TODO: fix bug when firstDay=6/weekOneDate=1 : https://github.com/moment/moment/issues/2115
  Date.prototype.getWeekOfYear = function () {
    var year = this.getFullYear(),
      month = this.getMonth(),
      date = this.getDate(),
      day = this.getDay();
    //var diff = weekOneDate - day + 7 * (day < firstDay ? -1 : 1);
    var diff = weekOneDate - day;
    if (day < firstDay) {
      diff -= 7;
    }
    if (diff + 7 < weekOneDate - firstDay) {
      diff += 7;
    }
    return Math.ceil(new Date(year, month, date + diff).getDayOfYear() / 7);
  };

  // `getDayForWeek` returns the first day of this Date's week
  Date.prototype.getDayForWeek = function () {
    var day = this.getDay();
    var diff = (day < firstDay ? -7 : 0) + firstDay - day;
    return new Date(this.getFullYear(), this.getMonth(), this.getDate() + diff);
  };

  $.fn.gantt = function (options) {
    var scales = ["hours", "days", "weeks", "months"];
    //Default settings
    var settings = {
      cellSize: 24, // cell size for the gantt chart
      source: {},
      holidays: [],
      // paging
      itemsPerPage: 10,
      // localisation
      dow: ["S", "M", "T", "W", "T", "F", "S"],
      // dow: ["日", "月", "火", "水", "木", "金", "土"],
      months: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ],
      // months: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
      // navigation
      navigate: "scroll", // buttons or scroll
      scrollToToday: true,
      // cookie options
      useCookie: false,
      cookieKey: "jquery-gantt-chart",
      // scale parameters
      scale: "days",
      maxScale: "months",
      minScale: "hours",
      // callbacks
      onItemClick: data => {},
      onAddClick: (dt, rowId) => {},
      onRender: () => {},
      onGetPage: async page => {},
    };

    // read options
    $.extend(settings, options);

    // can't use cookie if don't have `$.cookie`
    settings.useCookie = settings.useCookie && $.isFunction($.cookie);

    // Grid management
    // ===============

    // Core object is responsible for navigation and rendering
    var core = {
      // Return the element whose topmost point lies under the given point
      elementFromPoint: (function () {
        return function (x, y) {
          return document.elementFromPoint(x - window.scrollX, y - window.scrollY);
        };
      })(),

      setData: (element, data) => {
        element.data = data.data;
        element.pageNum = data.currentPage;
        element.pageCount = data.pageCount;
        element.totalItems = data.totalItems;
        settings.itemsPerPage = data.itemsPerPage;
      },

      // **Create the chart**
      create: function (element) {
        // Initialize data
        // request depending on `settings.source`
        if (typeof settings.source !== "string") {
          core.setData(element, settings.source);
          core.init(element);
        } else {
          $.getJSON(settings.source, function (jsData) {
            core.setData(element, jsData);
            core.init(element);
          });
        }
      },

      // **Setup the initial view**
      // Here we calculate the number of rows, pages and visible start
      // and end dates once the data are ready
      init: function (element) {
        element.rowsNum = element.data.length;
        element.rowsOnLastPage = element.totalItems % settings.itemsPerPage;

        element.dateStart = tools.getMinDate(element);
        element.dateEnd = tools.getMaxDate(element);

        core.render(element);
      },

      // **Render the grid**
      render: function (element) {
        var content = $('<div class="fn-content"/>');
        var $leftPanel = core.leftPanel(element);
        content.append($leftPanel);
        var $rightPanel = core.rightPanel(element, $leftPanel);

        content.append($rightPanel);

        var $dataPanel = $rightPanel.find(".dataPanel");

        element.gantt = $('<div class="fn-gantt" />').append(content);
        element.gantt.get(0).style.setProperty("--cell-size", tools.getCellSize() + "px");

        $(element).empty().append(element.gantt);

        element.canScroll = $dataPanel.width() > $rightPanel.width();

        content.append(core.navigation(element));

        core.fillData(element, $dataPanel, $leftPanel);

        // Set a cookie to record current position in the view
        if (settings.useCookie) {
          $.cookie(settings.cookieKey + "ScrollPos");
        }

        // Scroll the grid to today's date
        if (settings.scrollToToday) {
          core.navigateTo(element, "now");
          // or, scroll the grid to the left most date in the panel
        } else {
          core.updateProgressAndScroll(element, 0);
        }

        $dataPanel.css({ height: $leftPanel.height() });
        settings.onRender();
      },

      // Create and return the left panel with labels
      leftPanel: function (element) {
        /* Left panel */
        var ganttLeftPanel = $('<div class="leftPanel"/>').append(
          $('<div class="row spacer"/>').css("height", tools.getCellSize() * element.headerRows)
        );

        const entries = element.data.map((entry, i) => {
          const dataId = entry?.id ? `data-id="${entry.id}"` : "";
          const offset = (i % settings.itemsPerPage) * tools.getCellSize();
          return `<li class="row fn-label row${i} ${entry.cssClass || ""}" ${dataId} 
            id="rowheader${i}" data-offset="${offset}">
            ${entry.name || ""} ${entry.desc ? "(" + entry.desc + ")" : ""}
          </li>`;
        });
        const rowList = $('<ul class="row-list"/>');
        return ganttLeftPanel.append(rowList.append(entries.join("")));
      },

      // Create and return the data panel element
      dataPanel: function (element, width) {
        var dataPanel = $('<div class="dataPanel" style="width: ' + width + 'px;"/>');

        $(element).on("wheel", e => element.canScroll && core.wheelScroll(element, e));

        // Handle click events and dispatch to registered `onAddClick` function
        dataPanel.on("click", e => {
          e.stopPropagation();
          var corrY;
          var leftpanel = $(element).find(".fn-gantt .leftPanel");
          var datapanel = $(element).find(".fn-gantt .dataPanel");
          switch (settings.scale) {
            case "months":
              corrY = tools.getCellSize();
              break;
            case "hours":
              corrY = tools.getCellSize() * 4;
              break;
            case "days":
              corrY = tools.getCellSize() * 3;
              break;
            case "weeks":
            /* falls through */
            default:
              corrY = tools.getCellSize() * 2;
          }

          /* Adjust, so get middle of elm
                corrY -= Math.floor(tools.getCellSize() / 2);
              */

          // Find column where click occurred
          var col = core.elementFromPoint(e.pageX, datapanel.offset().top + corrY);
          // Was the label clicked directly?
          if (col.className === "fn-label") {
            col = $(col.parentNode);
          } else {
            col = $(col);
          }

          var dt = col.data("repdate");
          // Find row where click occurred
          var row = core.elementFromPoint(leftpanel.offset().left + leftpanel.width() - 10, e.pageY);
          // Was the label clicked directly?
          if (row.className.indexOf("fn-label") === 0) {
            row = $(row.parentNode);
          } else {
            row = $(row);
          }
          var rowId = row.data("id");
          // Dispatch user registered function with the DateTime in ms
          // and the id if the clicked object is a row
          settings.onAddClick(
            new Date(dt),
            element.data.find(el => el.id === rowId)
          );
        });
        return dataPanel;
      },

      // Creates and return the right panel containing the year/week/day header
      rightPanel: function (element, leftPanel /* <- never used? */) {
        var range = null;
        // Days of the week have a class of one of
        // `sn` (Sunday), `sa` (Saturday), or `wd` (Weekday)
        var dowClass = ["sn", "wd", "wd", "wd", "wd", "wd", "sa"];
        //unused: was someone planning to allow styles to stretch to the bottom of the chart?
        //var gridDowClass = [" sn", "", "", "", "", "", " sa"];

        var yearArr = [];
        var scaleUnitsThisYear = 0;

        var monthArr = [];
        var scaleUnitsThisMonth = 0;

        var dayArr = [];
        var hoursInDay = 0;

        var dowArr = [];
        var horArr = [];

        var today = new Date();
        today.setHours(0, 0, 0, 0);

        // reused variables
        var $row = $('<div class="row gt_header"></div>');
        var i, len;
        var year, month, week, day;
        var rday, dayClass;
        var dataPanel, dataPanelWidth;

        // Setup the headings based on the chosen `settings.scale`
        switch (settings.scale) {
          // **Hours**
          case "hours":
            range = tools.parseTimeRange(element.dateStart, element.dateEnd, element.scaleStep);
            dataPanelWidth = range.length * tools.getCellSize();

            year = range[0].getFullYear();
            month = range[0].getMonth();
            day = range[0];

            for (i = 0, len = range.length; i < len; i++) {
              rday = range[i];

              // Fill years
              var rfy = rday.getFullYear();
              if (rfy !== year) {
                yearArr.push(
                  `<div class="row year" style="width: ${tools.getCellSize() * scaleUnitsThisYear}px">
                        <div class="fn-label">${year}</div>
                      </div>`
                );

                year = rfy;
                scaleUnitsThisYear = 0;
              }
              scaleUnitsThisYear++;

              // Fill months
              var rm = rday.getMonth();
              if (rm !== month) {
                monthArr.push(
                  `<div class="row month" style="width: ${tools.getCellSize() * scaleUnitsThisMonth}px">
                        <div class="fn-label">${settings.months[month]}</div>
                      </div>`
                );

                month = rm;
                scaleUnitsThisMonth = 0;
              }
              scaleUnitsThisMonth++;

              // Fill days & hours
              var rgetDay = rday.getDay();
              var getDay = day.getDay();
              if (rgetDay !== getDay) {
                dayClass = today - day === 0 ? "today" : tools.isHoliday(day.getTime()) ? "holiday" : dowClass[getDay];

                dayArr.push(
                  `<div class="row date ${dayClass}" style="width: ${tools.getCellSize() * hoursInDay}px">
                        <div class="fn-label">${day.getDate()}</div>
                      </div>`
                );
                dowArr.push(
                  `<div class="row day ${dayClass}" style="width: ${tools.getCellSize() * hoursInDay}px">
                        <div class="fn-label">${settings.dow[getDay]}</div>
                      </div>`
                );

                day = rday;
                hoursInDay = 0;
              }
              hoursInDay++;

              dayClass = dowClass[rgetDay];
              if (tools.isHoliday(rday)) {
                dayClass = "holiday";
              }
              horArr.push(
                `<div class="row day ${dayClass}" id="dh-${rday.getTime()}"
                      data-offset="${i * tools.getCellSize()}" data-repdate="${rday.getRepDate(settings.scale)}">
                      <div class="fn-label">${rday.getHours()}</div>
                    </div>`
              );
            }

            // Last year
            yearArr.push(
              `<div class="row year" style="width: ${tools.getCellSize() * scaleUnitsThisYear}px">
                    <div class="fn-label">${year}</div>
                  </div>`
            );

            // Last month
            monthArr.push(
              `<div class="row month" style="width: ${tools.getCellSize() * scaleUnitsThisMonth}px">
                    <div class="fn-label">${settings.months[month]}</div>
                  </div>`
            );

            dayClass = dowClass[day.getDay()];

            if (tools.isHoliday(day)) {
              dayClass = "holiday";
            }

            dayArr.push(
              `<div class="row date ${dayClass}" style="width: ${tools.getCellSize() * hoursInDay}px">
                    <div class="fn-label">${day.getDate()}</div>
                  </div>`
            );

            dowArr.push(
              `<div class="row day ${dayClass}" style="width: ${tools.getCellSize() * hoursInDay}px">
                    <div class="fn-label">${settings.dow[day.getDay()]}</div>
                  </div>`
            );

            dataPanel = core.dataPanel(element, dataPanelWidth);

            // Append panel elements
            dataPanel.append(
              $row.clone().html(yearArr.join("")),
              $row.clone().html(monthArr.join("")),
              $row.clone().html(dayArr.join("")),
              $row.clone().html(dowArr.join("")),
              $row.clone().html(horArr.join(""))
            );
            break;

          // **Weeks**
          case "weeks":
            range = tools.parseWeeksRange(element.dateStart, element.dateEnd);
            dataPanelWidth = range.length * tools.getCellSize();

            year = range[0].getFullYear();
            month = range[0].getMonth();
            week = range[0].getWeekOfYear();
            var diff;

            for (i = 0, len = range.length; i < len; i++) {
              rday = range[i];

              // Fill years
              if (week > (week = rday.getWeekOfYear())) {
                // partial weeks to subtract from year header
                diff = rday.getDate() - 1;
                // offset one month (December) if week starts in last year
                diff -= !rday.getMonth() ? 0 : 31;
                diff /= 7;
                yearArr.push(
                  `<div class="row year" style="width: ${tools.getCellSize() * (scaleUnitsThisYear - diff)}px">
                        <div class="fn-label">${year}</div>
                      </div>`
                );
                year++;
                scaleUnitsThisYear = diff;
              }
              scaleUnitsThisYear++;

              // Fill months
              if (rday.getMonth() !== month) {
                // partial weeks to subtract from month header
                diff = rday.getDate() - 1;
                // offset one week if week starts in last month
                //diff -= (diff <= 6) ? 0 : 7;
                diff /= 7;
                monthArr.push(
                  `<div class="row month" style="width: ${tools.getCellSize() * (scaleUnitsThisMonth - diff)}px">
                        <div class="fn-label">${settings.months[month]}</div>
                      </div>`
                );
                month = rday.getMonth();
                scaleUnitsThisMonth = diff;
              }
              scaleUnitsThisMonth++;

              const _dayClass =
                today - rday === 0 ? "today" : tools.isHoliday(rday) ? "holiday" : dowClass[rday.getDay()];
              // Fill weeks
              dayArr.push(
                `<div class="row day ${_dayClass}" id="${rday.getWeekId()}" 
                      data-offset="${i * tools.getCellSize()}" data-repdate="${rday.getRepDate(settings.scale)}">
                      <div class="fn-label">${week}</div>
                    </div>`
              );
            }

            // Last year
            yearArr.push(
              `<div class="row year" style="width: ${tools.getCellSize() * scaleUnitsThisYear}px">
                    <div class="fn-label">${year}</div>
                  </div>`
            );

            // Last month
            monthArr.push(
              `<div class="row month" style="width: ${tools.getCellSize() * scaleUnitsThisMonth}px">
                    <div class="fn-label">${settings.months[month]}</div>
                  </div>`
            );

            dataPanel = core.dataPanel(element, dataPanelWidth);

            // Append panel elements
            dataPanel.append(
              $row.clone().html(yearArr.join("")),
              $row.clone().html(monthArr.join("")),
              $row.clone().html(dayArr.join(""))
            );
            break;

          // **Months**
          case "months":
            range = tools.parseMonthsRange(element.dateStart, element.dateEnd);
            dataPanelWidth = range.length * tools.getCellSize();

            year = range[0].getFullYear();
            month = range[0].getMonth();

            for (i = 0, len = range.length; i < len; i++) {
              rday = range[i];

              // Fill years
              if (rday.getFullYear() !== year) {
                yearArr.push(
                  `<div class="row year" style="width: ${tools.getCellSize() * scaleUnitsThisYear}px">
                        <div class="fn-label">${year}</div>
                      </div>`
                );
                year = rday.getFullYear();
                scaleUnitsThisYear = 0;
              }
              scaleUnitsThisYear++;
              monthArr.push(
                `<div class="row day wd" id="dh-${tools.genId(rday)}"
                      data-offset="${i * tools.getCellSize()}" data-repdate="${rday.getRepDate(settings.scale)}">
                      ${1 + rday.getMonth()}
                    </div>`
              );
            }

            // Last year
            yearArr.push(
              `<div class="row year" style="width: ${tools.getCellSize() * scaleUnitsThisYear}px">
                    <div class="fn-label">${year}</div>
                  </div>`
            );

            dataPanel = core.dataPanel(element, dataPanelWidth);

            // Append panel elements
            dataPanel.append($row.clone().html(yearArr.join("")), $row.clone().html(monthArr.join("")));
            break;

          // **Days (default)**
          default:
            range = tools.generateDateRange(element.dateStart, element.dateEnd);
            dataPanelWidth = range.length * tools.getCellSize();

            year = range[0].getFullYear();
            month = range[0].getMonth();

            for (i = 0, len = range.length; i < len; i++) {
              rday = range[i];

              // Fill years
              if (rday.getFullYear() !== year) {
                yearArr.push(
                  `<div class="row year" style="width: ${tools.getCellSize() * scaleUnitsThisYear}px">
                        <div class="fn-label">${year}</div>
                      </div>`
                );
                year = rday.getFullYear();
                scaleUnitsThisYear = 0;
              }
              scaleUnitsThisYear++;

              // Fill months
              if (rday.getMonth() !== month) {
                monthArr.push(
                  `<div class="row month" style="width: ${tools.getCellSize() * scaleUnitsThisMonth}px">
                        <div class="fn-label">${settings.months[month]}</div>
                      </div>`
                );
                month = rday.getMonth();
                scaleUnitsThisMonth = 0;
              }
              scaleUnitsThisMonth++;

              day = rday.getDay();
              // dayClass = dowClass[day];
              let _dayClass =
                today - rday === 0 ? "today" : tools.isHoliday(rday) ? "holiday" : dowClass[rday.getDay()];
              if (tools.isHoliday(rday)) {
                _dayClass = "holiday";
              }

              dayArr.push(
                `<div class="row date ${_dayClass}" id="dh-${tools.genId(rday)}"
                      data-offset="${i * tools.getCellSize()}" data-repdate="${rday.getRepDate(settings.scale)}">
                      <div class="fn-label">${rday.getDate()}</div>
                    </div>`
              );
              dowArr.push(
                `<div class="row day ${_dayClass}" id="dw-${tools.genId(rday)}" 
                      data-repdate="${rday.getRepDate(settings.scale)}">
                      <div class="fn-label">${settings.dow[day]}</div>
                    </div>`
              );
            } //for

            // Last year
            yearArr.push(
              `<div class="row year" style="width: ${tools.getCellSize() * scaleUnitsThisYear}px">
                    <div class="fn-label">${year}</div>
                  </div>`
            );

            // Last month
            monthArr.push(
              `<div class="row month" style="width: ${tools.getCellSize() * scaleUnitsThisMonth}px">
                    <div class="fn-label">${settings.months[month]}</div>
                  </div>`
            );

            dataPanel = core.dataPanel(element, dataPanelWidth);

            // Append panel elements
            dataPanel.append(
              $row.clone().html(yearArr.join("")),
              $row.clone().html(monthArr.join("")),
              $row.clone().html(dayArr.join("")),
              $row.clone().html(dowArr.join(""))
            );
        }

        return $('<div class="rightPanel"></div>').append(dataPanel);
      },

      // **Navigation**
      navigation: function (element) {
        var ganttNavigate = null;
        // Scrolling navigation is provided by setting
        // `settings.navigate='scroll'`
        if (settings.navigate === "scroll") {
          ganttNavigate = $('<div class="navigate" />').append(
            $('<div class="nav-slider" />')
              .append(
                $('<div class="nav-slider-left" />')
                  .append(
                    $(`<button type="button" class="btn btn-outline-dark nav-page-back" title="Previous page">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-dash-circle" viewBox="0 0 16 16">
                          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                          <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8"/>
                        </svg></button>`).on("click", () => core.navigatePage(element, -1))
                  )
                  .append(
                    $(
                      `<div class="page-number text-md-left"><span>${element.pageNum} / ${element.pageCount}</span></div>`
                    )
                  )
                  .append(
                    $(`<button type="button" class="btn btn-outline-dark nav-page-next" title="Next page">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-circle" viewBox="0 0 16 16">
                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
                          </svg></button>`).on("click", () => core.navigatePage(element, 1))
                  )
                  .append(
                    $(`<button type="button" class="btn btn-outline-dark nav-now" title="Show current time">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-crosshair" viewBox="0 0 16 16">
                          <path d="M8.5.5a.5.5 0 0 0-1 0v.518A7 7 0 0 0 1.018 7.5H.5a.5.5 0 0 0 0 1h.518A7 7 0 0 0 7.5 14.982v.518a.5.5 0 0 0 1 0v-.518A7 7 0 0 0 14.982 8.5h.518a.5.5 0 0 0 0-1h-.518A7 7 0 0 0 8.5 1.018zm-6.48 7A6 6 0 0 1 7.5 2.02v.48a.5.5 0 0 0 1 0v-.48a6 6 0 0 1 5.48 5.48h-.48a.5.5 0 0 0 0 1h.48a6 6 0 0 1-5.48 5.48v-.48a.5.5 0 0 0-1 0v.48A6 6 0 0 1 2.02 8.5h.48a.5.5 0 0 0 0-1zM8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4"/>
                        </svg></button>`).on("click", () => core.navigateTo(element, "now"))
                  )
                  .append(
                    $(
                      `<button type="button" class="btn btn-outline-dark nav-prev-week" title="Slide more to the left">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-double-left" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M8.354 1.646a.5.5 0 0 1 0 .708L2.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0"/>
                            <path fill-rule="evenodd" d="M12.354 1.646a.5.5 0 0 1 0 .708L6.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0"/>
                          </svg></button>`
                    ).on("click", function () {
                      if (settings.scale === "hours") {
                        core.navigateTo(element, tools.getCellSize() * 8); // 8 hours
                      } else if (settings.scale === "days") {
                        core.navigateTo(element, tools.getCellSize() * 30);
                      } else if (settings.scale === "weeks") {
                        core.navigateTo(element, tools.getCellSize() * 12);
                      } else if (settings.scale === "months") {
                        core.navigateTo(element, tools.getCellSize() * 6);
                      }
                    })
                  )
                  .append(
                    $(`<button type="button" class="btn btn-outline-dark nav-prev-day" title="Slide to the left">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-left" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0"/>
                          </svg></button>`).on("click", function () {
                      if (settings.scale === "hours") {
                        core.navigateTo(element, tools.getCellSize() * 4);
                      } else if (settings.scale === "days") {
                        core.navigateTo(element, tools.getCellSize() * 7);
                      } else if (settings.scale === "weeks") {
                        core.navigateTo(element, tools.getCellSize() * 4);
                      } else if (settings.scale === "months") {
                        core.navigateTo(element, tools.getCellSize() * 3);
                      }
                    })
                  )
              )
              .append(core.progressBarLogic(element))
              .append(
                $('<div class="nav-slider-right" />')
                  .append(
                    $(`<button type="button" class="btn btn-outline-dark nav-next-day" title="Slide to the right">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-right" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708"/>
                          </svg></button>`).on("click", function () {
                      if (settings.scale === "hours") {
                        core.navigateTo(element, tools.getCellSize() * -4);
                      } else if (settings.scale === "days") {
                        core.navigateTo(element, tools.getCellSize() * -7);
                      } else if (settings.scale === "weeks") {
                        core.navigateTo(element, tools.getCellSize() * -4);
                      } else if (settings.scale === "months") {
                        core.navigateTo(element, tools.getCellSize() * -3);
                      }
                    })
                  )
                  .append(
                    $(
                      `<button type="button" class="btn btn-outline-dark nav-next-week" title="Slide more to the right">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-double-right" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M3.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L9.293 8 3.646 2.354a.5.5 0 0 1 0-.708"/>
                            <path fill-rule="evenodd" d="M7.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L13.293 8 7.646 2.354a.5.5 0 0 1 0-.708"/>
                          </svg></button>`
                    ).on("click", function () {
                      if (settings.scale === "hours") {
                        core.navigateTo(element, tools.getCellSize() * -8);
                      } else if (settings.scale === "days") {
                        core.navigateTo(element, tools.getCellSize() * -30);
                      } else if (settings.scale === "weeks") {
                        core.navigateTo(element, tools.getCellSize() * -12);
                      } else if (settings.scale === "months") {
                        core.navigateTo(element, tools.getCellSize() * -6);
                      }
                    })
                  )
                  .append(
                    $(`<button type="button" class="btn btn-outline-dark nav-zoomIn" title="Zoom in">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-zoom-in" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11M13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0"/>
                            <path d="M10.344 11.742q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1 6.5 6.5 0 0 1-1.398 1.4z"/>
                            <path fill-rule="evenodd" d="M6.5 3a.5.5 0 0 1 .5.5V6h2.5a.5.5 0 0 1 0 1H7v2.5a.5.5 0 0 1-1 0V7H3.5a.5.5 0 0 1 0-1H6V3.5a.5.5 0 0 1 .5-.5"/>
                          </svg></button>`).on("click", () => core.zoomInOut(element, -1))
                  )
                  .append(
                    $(`<button type="button" class="btn btn-outline-dark nav-zoomOut" title="Zoom out">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-zoom-out" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11M13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0"/>
                            <path d="M10.344 11.742q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1 6.5 6.5 0 0 1-1.398 1.4z"/>
                            <path fill-rule="evenodd" d="M3 6.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5"/>
                          </svg></button>`).on("click", () => core.zoomInOut(element, 1))
                  )
              )
          );
          // Button navigation is provided by setting `settings.navigation=`buttons``
        } else {
          ganttNavigate = $('<div class="navigate" />')
            .append(
              $(`<button type="button" class="btn btn-outline-dark nav-page-back" title="Previous page">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-dash-circle" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                  <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8"/>
                </svg></button>`).on("click", () => core.navigatePage(element, -1))
            )
            .append(
              $(`<div class="page-number text-md-left"><span>${element.pageNum} / ${element.pageCount}</span></div>`)
            )
            .append(
              $(`<button type="button" class="btn btn-outline-dark nav-page-next" title="Next page">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-circle" viewBox="0 0 16 16">
                      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                      <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
                    </svg></button>`).on("click", () => core.navigatePage(element, 1))
            )
            .append(
              $(`<button type="button" class="btn btn-outline-dark nav-begin" title="Go to the beginning">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-skip-backward-circle" viewBox="0 0 16 16">
                      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                      <path d="M11.729 5.055a.5.5 0 0 0-.52.038L8.5 7.028V5.5a.5.5 0 0 0-.79-.407L5 7.028V5.5a.5.5 0 0 0-1 0v5a.5.5 0 0 0 1 0V8.972l2.71 1.935a.5.5 0 0 0 .79-.407V8.972l2.71 1.935A.5.5 0 0 0 12 10.5v-5a.5.5 0 0 0-.271-.445"/>
                    </svg></button>`).on("click", () => core.navigateTo(element, "begin"))
            )
            .append(
              $(`<button type="button" class="btn btn-outline-dark nav-prev-week" title="Slide more to the left">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-double-left" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M8.354 1.646a.5.5 0 0 1 0 .708L2.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0"/>
                    <path fill-rule="evenodd" d="M12.354 1.646a.5.5 0 0 1 0 .708L6.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0"/>
                  </svg></button>`).on("click", () => core.navigateTo(element, tools.getCellSize() * 7))
            )
            .append(
              $(`<button type="button" class="btn btn-outline-dark nav-prev-day" title="Slide to the left">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-left" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0"/>
                  </svg></button>`).on("click", () => core.navigateTo(element, tools.getCellSize()))
            )
            .append(
              $(`<button type="button" class="btn btn-outline-dark nav-now" title="Show current time">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-crosshair" viewBox="0 0 16 16">
                      <path d="M8.5.5a.5.5 0 0 0-1 0v.518A7 7 0 0 0 1.018 7.5H.5a.5.5 0 0 0 0 1h.518A7 7 0 0 0 7.5 14.982v.518a.5.5 0 0 0 1 0v-.518A7 7 0 0 0 14.982 8.5h.518a.5.5 0 0 0 0-1h-.518A7 7 0 0 0 8.5 1.018zm-6.48 7A6 6 0 0 1 7.5 2.02v.48a.5.5 0 0 0 1 0v-.48a6 6 0 0 1 5.48 5.48h-.48a.5.5 0 0 0 0 1h.48a6 6 0 0 1-5.48 5.48v-.48a.5.5 0 0 0-1 0v.48A6 6 0 0 1 2.02 8.5h.48a.5.5 0 0 0 0-1zM8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4"/>
                    </svg></button>`).on("click", () => core.navigateTo(element, "now"))
            )
            .append(
              $(`<button type="button" class="btn btn-outline-dark nav-next-day" title="Slide to the right">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-right" viewBox="0 0 16 16">
                      <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708"/>
                    </svg></button>`).on("click", () => core.navigateTo(element, tools.getCellSize() * -1))
            )
            .append(
              $(`<button type="button" class="btn btn-outline-dark nav-next-week" title="Slide more to the right">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-double-right" viewBox="0 0 16 16">
                      <path fill-rule="evenodd" d="M3.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L9.293 8 3.646 2.354a.5.5 0 0 1 0-.708"/>
                      <path fill-rule="evenodd" d="M7.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L13.293 8 7.646 2.354a.5.5 0 0 1 0-.708"/>
                    </svg></button>`).on("click", () => core.navigateTo(element, tools.getCellSize() * -7))
            )
            .append(
              $(`<button type="button" class="btn btn-outline-dark nav-end" title="Go to the end">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-skip-forward-circle" viewBox="0 0 16 16">
                      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                      <path d="M4.271 5.055a.5.5 0 0 1 .52.038L7.5 7.028V5.5a.5.5 0 0 1 .79-.407L11 7.028V5.5a.5.5 0 0 1 1 0v5a.5.5 0 0 1-1 0V8.972l-2.71 1.935a.5.5 0 0 1-.79-.407V8.972l-2.71 1.935A.5.5 0 0 1 4 10.5v-5a.5.5 0 0 1 .271-.445"/>
                    </svg></button>`).on("click", () => core.navigateTo(element, "end"))
            )
            .append(
              $(`<button type="button" class="btn btn-outline-dark nav-zoomIn" title="Zoom in">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-zoom-in" viewBox="0 0 16 16">
                      <path fill-rule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11M13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0"/>
                      <path d="M10.344 11.742q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1 6.5 6.5 0 0 1-1.398 1.4z"/>
                      <path fill-rule="evenodd" d="M6.5 3a.5.5 0 0 1 .5.5V6h2.5a.5.5 0 0 1 0 1H7v2.5a.5.5 0 0 1-1 0V7H3.5a.5.5 0 0 1 0-1H6V3.5a.5.5 0 0 1 .5-.5"/>
                    </svg></button>`).on("click", () => core.zoomInOut(element, -1))
            )
            .append(
              $(`<button type="button" class="btn btn-outline-dark nav-zoomOut" title="Zoom out">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-zoom-out" viewBox="0 0 16 16">
                      <path fill-rule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11M13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0"/>
                      <path d="M10.344 11.742q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1 6.5 6.5 0 0 1-1.398 1.4z"/>
                      <path fill-rule="evenodd" d="M3 6.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5"/>
                    </svg></button>`).on("click", () => core.zoomInOut(element, 1))
            )
            .append(core.progressBarLogic(element));
        }
        return $('<div class="bottom"></div>').append(ganttNavigate);
      },

      progressBarLogic: function (element) {
        const progressContainer = $(`
              <div class="progress bg-light border border-dark ${settings.navigate === "scroll" ? "" : "d-none"} 
                ${element.canScroll ? "canScroll" : ""}" title="Click to set progress, or (ctrl) shift+wheel to scroll">
                  <div class="progress-bar bg-light text-dark" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">0%</div>
                  <div class="circle" draggable="true" tabindex="0"></div>
              </div>`);

        const circle = progressContainer.find(".circle").get(0);
        circle.addEventListener("mousedown", function (event) {
          if (!element.canScroll) return event.preventDefault();
          // Calculate the initial position of the circle
          const initialX = event.clientX;
          const initialProgress = tools.getProgressBarProgress(element);

          // Add event listeners for mousemove and mouseup events
          document.addEventListener("mousemove", moveCircle);
          document.addEventListener("mouseup", stopMovingCircle);
          document.addEventListener("dragend", dragend);

          function moveCircle(e) {
            // Calculate the distance moved by the mouse
            const distance = e.clientX - initialX;

            // Calculate the new progress based on the distance moved
            let newProgress = initialProgress + (distance / progressContainer.get(0).offsetWidth) * 100;

            // Update the progress bar and circle position
            core.updateProgressAndScroll(element, newProgress);
          }

          function stopMovingCircle() {
            // Remove the event listeners for mousemove and mouseup events
            document.removeEventListener("mousemove", moveCircle);
            document.removeEventListener("mouseup", stopMovingCircle);
            document.removeEventListener("dragend", dragend);
          }

          function dragend(e) {
            moveCircle(e);
            stopMovingCircle();
          }
        });

        progressContainer.get(0).addEventListener("click", function (event) {
          if (!element.canScroll) return event.preventDefault();
          const rect = progressContainer.get(0).getBoundingClientRect();
          const newProgress = ((event.clientX - rect.left) / rect.width) * 100;
          core.updateProgressAndScroll(element, newProgress);
        });
        return progressContainer;
      },

      // **Progress Bar**
      // Return an element representing a progress of position within the entire chart
      createProgressBar: function (label = "", desc, classNames, dataObj) {
        const l = d => new Date(d).toLocaleString();
        var bar = $(
          `<div class="bar" title="${label}" data-bs-content="From ${l(dataObj.from)} to ${l(dataObj.to)}">
                <div class="fn-label">${label}</div>
              </div>`
        ).data("dataObj", dataObj);
        if (classNames) {
          bar.addClass(classNames);
        }
        bar.on("click", e => {
          e.stopPropagation();
          settings.onItemClick(dataObj);
        });
        return bar;
      },

      // **Fill the Chart**
      // Parse the data and fill the data panel
      fillData: function (element, datapanel, leftpanel /* <- never used? */) {
        var cellWidth = tools.getCellSize();
        var barOffset = (cellWidth - 18) / 2;
        var dataPanelWidth = datapanel.width();
        var invertColor = function (colStr) {
          try {
            colStr = colStr.replace("rgb(", "").replace(")", "");
            var rgbArr = colStr.split(",");
            var R = parseInt(rgbArr[0], 10);
            var G = parseInt(rgbArr[1], 10);
            var B = parseInt(rgbArr[2], 10);
            var gray = Math.round((255 - (0.299 * R + 0.587 * G + 0.114 * B)) * 0.9);
            return "rgb(" + gray + ", " + gray + ", " + gray + ")";
          } catch (err) {
            return "";
          }
        };
        // Loop through the values of each data element and set a row
        $.each(element.data, function (i, entry) {
          $.each(entry.values, function (j, day) {
            var _bar;
            var from, to, cFrom, cTo, dFrom, dTo, dl, dp;
            var topEl, top;

            switch (settings.scale) {
              // **Hourly data**
              case "hours":
                dFrom = tools.genId(tools.dateDeserialize(day.from), element.scaleStep);
                from = $(element).find("#dh-" + dFrom);
                dTo = tools.genId(tools.dateDeserialize(day.to), element.scaleStep);
                to = $(element).find("#dh-" + dTo);
                cFrom = from.data("offset");
                cTo = to.data("offset");
                dl = Math.floor((cTo - cFrom) / cellWidth) + 1;
                dp = (100 * (cellWidth * dl - 1)) / dataPanelWidth;

                _bar = core.createProgressBar(day.label, day.desc, day.customClass, day);

                // find row
                topEl = $(element).find("#rowheader" + i);
                top = cellWidth * 5 + barOffset + topEl.data("offset");
                _bar.css({
                  top: top,
                  left: Math.floor(cFrom),
                  width: dp + "%",
                });

                datapanel.append(_bar);
                break;

              // **Weekly data**
              case "weeks":
                dFrom = tools.dateDeserialize(day.from);
                dTo = tools.dateDeserialize(day.to);

                from = $(element).find("#" + dFrom.getWeekId());
                cFrom = from.data("offset");
                to = $(element).find("#" + dTo.getWeekId());
                cTo = to.data("offset");
                dl = Math.round((cTo - cFrom) / cellWidth) + 1;
                dp = (100 * (cellWidth * dl - 1)) / dataPanelWidth;

                _bar = core.createProgressBar(day.label, day.desc, day.customClass, day);

                // find row
                topEl = $(element).find("#rowheader" + i);
                top = cellWidth * 3 + barOffset + topEl.data("offset");
                _bar.css({
                  top: top,
                  left: Math.floor(cFrom),
                  width: dp + "%",
                });

                datapanel.append(_bar);
                break;

              // **Monthly data**
              case "months":
                dFrom = tools.dateDeserialize(day.from);
                dTo = tools.dateDeserialize(day.to);

                if (dFrom.getDate() <= 3 && dFrom.getMonth() === 0) {
                  dFrom.setDate(dFrom.getDate() + 4);
                }

                if (dFrom.getDate() <= 3 && dFrom.getMonth() === 0) {
                  dFrom.setDate(dFrom.getDate() + 4);
                }

                if (dTo.getDate() <= 3 && dTo.getMonth() === 0) {
                  dTo.setDate(dTo.getDate() + 4);
                }

                from = $(element).find("#dh-" + tools.genId(dFrom));
                cFrom = from.data("offset");
                to = $(element).find("#dh-" + tools.genId(dTo));
                cTo = to.data("offset");
                dl = Math.round((cTo - cFrom) / cellWidth) + 1;
                dp = (100 * (cellWidth * dl - 1)) / dataPanelWidth;

                _bar = core.createProgressBar(day.label, day.desc, day.customClass, day);

                // find row
                topEl = $(element).find("#rowheader" + i);
                top = cellWidth * 2 + barOffset + topEl.data("offset");
                _bar.css({
                  top: top,
                  left: Math.floor(cFrom),
                  width: dp + "%",
                });

                datapanel.append(_bar);
                break;

              // **Days**
              case "days":
              /* falls through */
              default:
                dFrom = tools.genId(tools.dateDeserialize(day.from));
                dTo = tools.genId(tools.dateDeserialize(day.to));
                from = $(element).find("#dh-" + dFrom);
                cFrom = from.data("offset");
                dl = Math.round((dTo - dFrom) / UTC_DAY_IN_MS) + 1;
                dp = (100 * (cellWidth * dl - 1)) / dataPanelWidth;

                _bar = core.createProgressBar(day.label, day.desc, day.customClass, day);

                // find row
                topEl = $(element).find("#rowheader" + i);
                top = cellWidth * 4 + barOffset + topEl.data("offset");
                _bar.css({
                  top: top,
                  left: Math.floor(cFrom),
                  width: dp + "%",
                });

                datapanel.append(_bar);
            }

            var $l = _bar.find(".fn-label");
            if ($l.length) {
              var gray = invertColor(_bar.css("backgroundColor"));
              $l.css("color", gray);
            }
          });
        });
      },
      // **Navigation**
      navigateTo: function (element, val) {
        var $rightPanel = $(element).find(".fn-gantt .rightPanel");
        var $dataPanel = $rightPanel.find(".dataPanel");
        var rightPanelWidth = $rightPanel.width();
        var dataPanelWidth = $dataPanel.width();
        const maxPossibleMargin = rightPanelWidth - dataPanelWidth;

        let percentToScroll = 0;
        switch (val) {
          case "begin":
            percentToScroll = 0;
            break;
          case "end":
            percentToScroll = 100;
            break;
          case "now":
            if (!element.canScroll || !$dataPanel.find(".today").length) {
              return false;
            }
            val = $dataPanel.find(".today").offset().left - $dataPanel.offset().left;
            val *= -1;
            if (val > 0) {
              val = 0;
            } else if (val < maxPossibleMargin) {
              val = maxPossibleMargin;
            }
            percentToScroll = (val * 100) / maxPossibleMargin;
            break;
          default:
            const curLeft = parseInt($dataPanel.css("left").replace("px", ""));
            val = curLeft + val;
            percentToScroll = (val * 100) / maxPossibleMargin;
        }
        core.updateProgressAndScroll(element, percentToScroll);
      },

      // Navigate to a specific page
      navigatePage: function (element, val) {
        const nextPage = Math.min(Math.max(element.pageNum + val, 1), element.pageCount);
        if (nextPage === element.pageNum) return console.log("No more pages to navigate to");
        settings.onGetPage(nextPage).then(data => {
          core.setData(element, data);
          core.init(element);
        });
      },

      // Change zoom level
      zoomInOut: function (element, val) {
        var zoomIn = val < 0;
        var scaleSt = element.scaleStep + val * 3;
        // adjust hour scale to desired factors of 24
        scaleSt = { 4: 3, 5: 6, 9: 8, 11: 12 }[scaleSt] || (scaleSt < 1 ? 1 : scaleSt);
        var scale = settings.scale;
        var headerRows = element.headerRows;
        if (settings.scale === "hours" && scaleSt >= 13) {
          scale = "days";
          headerRows = 4;
          scaleSt = 13;
        } else if (settings.scale === "days" && zoomIn) {
          scale = "hours";
          headerRows = 5;
          scaleSt = 12;
        } else if (settings.scale === "days" && !zoomIn) {
          scale = "weeks";
          headerRows = 3;
          scaleSt = 13;
        } else if (settings.scale === "weeks" && !zoomIn) {
          scale = "months";
          headerRows = 2;
          scaleSt = 14;
        } else if (settings.scale === "weeks" && zoomIn) {
          scale = "days";
          headerRows = 4;
          scaleSt = 13;
        } else if (settings.scale === "months" && zoomIn) {
          scale = "weeks";
          headerRows = 3;
          scaleSt = 13;
        }

        // do nothing if attempting to zoom past max/min
        if (
          (zoomIn && scales.indexOf(scale) < scales.indexOf(settings.minScale)) ||
          (!zoomIn && scales.indexOf(scale) > scales.indexOf(settings.maxScale))
        ) {
          core.init(element);
          return;
        }

        element.scaleStep = scaleSt;
        settings.scale = scale;
        element.headerRows = headerRows;

        if (settings.useCookie) {
          $.cookie(settings.cookieKey + "CurrentScale", settings.scale);
          // reset scrollPos
          $.cookie(settings.cookieKey + "ScrollPos", null);
        }
        core.init(element);
        // });
      },

      // Move chart via mousewheel
      wheelScroll: function (element, e) {
        if (!e.shiftKey) return; // only scroll when shift key is pressed
        e.preventDefault(); // e is a jQuery Event
        const ctrlKey = e.ctrlKey || e.metaKey || e.originalEvent.ctrlKey || e.originalEvent.metaKey;
        // https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent/deltaY
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sign
        const deltaY = Math.sign(e.deltaY || e.originalEvent.deltaY) || 0;
        let step = ctrlKey ? deltaY * 5 : deltaY * 1; // faster scroll if ctrl(meta) is pressed

        if (settings.scale === "hours") step *= 0.25; // slower scroll for hours

        const currentProgress = tools.getProgressBarProgress(element);
        const newProgress = currentProgress + step;
        core.updateProgressAndScroll(element, newProgress);
      },

      updateProgressAndScroll: function (element, _percent = 0) {
        if (element.canScroll === false) return;
        const percent = tools.setProgressBarProgress(element, _percent);
        const rightPanel = $(element).find(".rightPanel");
        const dataPanel = rightPanel.find(".dataPanel");
        const max = rightPanel.width() - dataPanel.width(); // if less than 0, we can scroll
        const pos = (max * percent) / 100; // formula to get the position
        dataPanel.css("left", `${pos}px`);
      },
    };

    // Utility functions
    // =================
    var tools = {
      // Get the current percentage of the progress bar
      getProgressBarProgress: function (element) {
        return parseFloat($(element).find(".progress").get(0).style.getPropertyValue("--progress")) || 0;
      },

      setProgressBarProgress: function (element, _percent) {
        const percent = tools.clamp(_percent); // clamp to 0-100
        $(element).find(".progress").get(0).style.setProperty("--progress", `${percent}%`);
        $(element)
          .find(".progress-bar")
          .text(`${Math.round(percent)}%`);
        return percent;
      },

      // Return the maximum available date in data depending on the scale
      getMaxDate: function (element) {
        var maxDate = null;
        $.each(element.data, function (i, entry) {
          $.each(entry.values, function (i, date) {
            var toDate = tools.dateDeserialize(date.to);
            if (isNaN(toDate)) {
              return;
            }
            maxDate = maxDate < toDate ? toDate : maxDate;
          });
        });
        maxDate = maxDate || new Date();
        var bd;
        switch (settings.scale) {
          case "hours":
            maxDate.setHours(Math.ceil(maxDate.getHours() / element.scaleStep) * element.scaleStep);
            maxDate.setHours(maxDate.getHours() + element.scaleStep * 3);
            break;
          case "weeks":
            // wtf is happening here?
            bd = new Date(maxDate.getTime());
            bd = new Date(bd.setDate(bd.getDate() + 3 * 7));
            var md = Math.floor(bd.getDate() / 7) * 7;
            maxDate = new Date(bd.getFullYear(), bd.getMonth(), md === 0 ? 4 : md - 3);
            break;
          case "months":
            bd = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
            bd.setMonth(bd.getMonth() + 2);
            maxDate = new Date(bd.getFullYear(), bd.getMonth(), 1);
            break;
          case "days":
          /* falls through */
          default:
            maxDate.setHours(0);
            maxDate.setDate(maxDate.getDate() + 3);
        }
        return maxDate;
      },

      // Return the minimum available date in data depending on the scale
      getMinDate: function (element) {
        // TODO: count be done in a more efficient way
        var minDate = null;
        $.each(element.data, function (i, entry) {
          $.each(entry.values, function (i, date) {
            var fromDate = tools.dateDeserialize(date.from);
            if (isNaN(fromDate)) {
              return;
            }
            minDate = minDate > fromDate || minDate === null ? fromDate : minDate;
          });
        });
        minDate = minDate || new Date();
        switch (settings.scale) {
          case "hours":
            minDate.setHours(Math.floor(minDate.getHours() / element.scaleStep) * element.scaleStep);
            minDate.setHours(minDate.getHours() - element.scaleStep * 3);
            break;
          case "weeks":
            minDate.setHours(0, 0, 0, 0);
            minDate.setDate(minDate.getDate() - 3 * 7);
            break;
          case "months":
            minDate.setHours(0, 0, 0, 0);
            minDate.setDate(1);
            minDate.setMonth(minDate.getMonth() - 3);
            break;
          case "days":
          /* falls through */
          default:
            minDate.setHours(0, 0, 0, 0);
            minDate.setDate(minDate.getDate() - 3);
        }
        return minDate;
      },

      // Return an array of Date objects between `from` and `to`
      generateDateRange: function (from, to) {
        var year = from.getFullYear();
        var month = from.getMonth();
        var date = from.getDate();
        var range = [],
          i = 0;
        do {
          range[i] = new Date(year, month, date + i);
        } while (range[i++] < to);
        return range;
      },

      // Return an array of Date objects between `from` and `to`,
      // scaled hourly
      parseTimeRange: function (from, to, scaleStep) {
        var year = from.getFullYear();
        var month = from.getMonth();
        var date = from.getDate();
        var hour = from.getHours();
        hour -= hour % scaleStep;
        var range = [],
          h = 0,
          i = 0;
        do {
          range[i] = new Date(year, month, date, hour + h++ * scaleStep);
          // overwrite any hours repeated due to DST changes
          if (i > 0 && range[i].getHours() === range[i - 1].getHours()) {
            i--;
          }
        } while (range[i++] < to);
        return range;
      },

      // Return an array of Date objects between a range of weeks
      // between `from` and `to`
      parseWeeksRange: function (from, to) {
        var current = from.getDayForWeek();

        var ret = [];
        var i = 0;
        do {
          ret[i++] = current.getDayForWeek();
          current.setDate(current.getDate() + 7);
        } while (current <= to);

        return ret;
      },

      // Return an array of Date objects between a range of months
      // between `from` and `to`
      parseMonthsRange: function (from, to) {
        var current = new Date(from);

        var ret = [];
        var i = 0;
        do {
          ret[i++] = new Date(current.getFullYear(), current.getMonth(), 1);
          current.setMonth(current.getMonth() + 1);
        } while (current <= to);

        return ret;
      },

      // Deserialize a date from a string or integer
      dateDeserialize: function (date) {
        if (typeof date === "string") {
          date = date.replace(/\/Date\((.*)\)\//, "$1");
          date = $.isNumeric(date) ? parseInt(date, 10) : $.trim(date);
        }
        return new Date(date);
      },

      // Generate an id for a date
      genId: function (t) {
        // varargs
        if ($.isNumeric(t)) {
          t = new Date(t);
        }
        switch (settings.scale) {
          case "hours":
            var hour = t.getHours();
            if (arguments.length >= 2) {
              hour = Math.floor(t.getHours() / arguments[1]) * arguments[1];
            }
            return new Date(t.getFullYear(), t.getMonth(), t.getDate(), hour).getTime();
          case "weeks":
            var y = t.getFullYear();
            var w = t.getWeekOfYear();
            var m = t.getMonth();
            if (m === 11 && w === 1) {
              y++;
            } else if (!m && w > 51) {
              y--;
            }
            return y + "-" + w;
          case "months":
            return t.getFullYear() + "-" + t.getMonth();
          case "days":
          /* falls through */
          default:
            return new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime();
        }
      },

      // normalizes an array of dates into a map of start-of-day millisecond values
      _datesToDays: function (dates) {
        var dayMap = {};
        for (var i = 0, len = dates.length, day; i < len; i++) {
          day = tools.dateDeserialize(dates[i]);
          dayMap[day.setHours(0, 0, 0, 0)] = true;
        }
        return dayMap;
      },
      // Returns true when the given date appears in the array of holidays, if provided
      isHoliday: (function () {
        // IIFE
        // short-circuits the function if no holidays option was passed
        if (!settings.holidays || !settings.holidays.length) {
          return function () {
            return false;
          };
        }
        var holidays = false;
        // returns the function that will be used to check for holidayness of a given date
        return function (date) {
          if (!holidays) {
            holidays = tools._datesToDays(settings.holidays);
          }
          return !!holidays[
            // assumes numeric dates are already normalized to start-of-day
            $.isNumeric(date) ? date : new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
          ];
        };
      })(),

      // Get the current cell height
      getCellSize: function () {
        return settings.cellSize;
      },

      // Get the current page height
      // getPageHeight: function (element) {
      //   return element.pageNum === element.pageCount
      //     ? element.rowsOnLastPage * tools.getCellSize()
      //     : settings.itemsPerPage * tools.getCellSize();
      // },

      // clamp a number to a range
      clamp: function (val, min = 0, max = 100) {
        return Math.min(max, Math.max(min, val));
      },
    };

    this.each(function () {
      this.data = null; // Received data
      this.pageNum = 0; // Current page number
      this.pageCount = 0; // Available pages count
      this.totalItems = 0; // Total items count
      this.rowsOnLastPage = 0; // How many rows on last page
      this.rowsNum = 0; // Number of total rows
      this.dateStart = null;
      this.dateEnd = null;
      this.headerRows = null;

      // Update cookie with current scale
      if (settings.useCookie) {
        var sc = $.cookie(settings.cookieKey + "CurrentScale");
        if (sc) {
          settings.scale = sc;
        } else {
          $.cookie(settings.cookieKey + "CurrentScale", settings.scale);
        }
      }

      switch (settings.scale) {
        //case "hours":
        //    this.headerRows = 5;
        //    this.scaleStep = 8;
        //    break;
        case "hours":
          this.headerRows = 5;
          this.scaleStep = 1;
          break;
        case "weeks":
          this.headerRows = 3;
          this.scaleStep = 13;
          break;
        case "months":
          this.headerRows = 2;
          this.scaleStep = 14;
          break;
        case "days":
        /* falls through */
        default:
          this.headerRows = 4;
          this.scaleStep = 13;
      }

      this.canScroll = true;
      this.gantt = null;
      core.create(this);
    });
  };
})(jQuery);

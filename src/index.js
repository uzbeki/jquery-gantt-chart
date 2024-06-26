/**
 * @license MIT
 * @version 0.3.0
 * @name jQuery Gantt Chart
 * @description jQuery Gantt Chart is a simple chart that implements gantt functionality as a jQuery component.
 * @author Bekhruz Otaev
 * @link https://github.com/uzbeki/jquery-gantt-chart/
 */

import Movable from "./helpers/Movable.js";
import Resizer from "./helpers/Resizer.js";
import Tooltip from "./helpers/Tooltip.js";
import DragAndSort, { getOrder } from "./helpers/index.js";
import { initialSettings } from "./helpers/initials.js";
import { NAVIGATION_TEMPLATE, header_month, header_year } from "./helpers/templates.js";
import {
  HOUR_SCALES,
  SCALE_HEADER_COUNT,
  SCALE_HOUR_STEPS,
  adjustDate,
  areDatesEqual,
  countWorkDays,
  dateToScale,
  getMonthId,
  getNavigationValues,
  getNextZoomScale,
  getOneScaleValue,
  getScaledDifference,
  parseCSVDates,
  sanitizeSource
} from "./helpers/utils.js";

function main() {
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
    //Default settings
    var settings = initialSettings;
    // read options
    options.holidays = (options.holidays || []).map(h => new Date(h)); // convert to Date objects
    $.extend(settings, options);
    if (options?.cellSize) {
      if (!options?.barOptions?.resizability?.stepSize) settings.barOptions.resizability.stepSize = options.cellSize;
      if (!options?.barOptions?.resizability?.minWidth) settings.barOptions.resizability.minWidth = options.cellSize;
      if (!options?.barOptions?.movability?.stepSize) settings.barOptions.movability.stepSize = options.cellSize;
    }

    // Grid management
    // ===============

    // Core object is responsible for navigation and rendering
    var core = {
      // Return the element whose topmost point lies under the given point
      elementFromPoint: function (x, y) {
        return document.elementFromPoint(x - window.scrollX, y - window.scrollY);
      },

      setData: (element, data) => {
        const { isValid, source, minDate, maxDate } = sanitizeSource(data);
        if (!isValid) throw new Error("Invalid data source");
        element.minDate = minDate;
        element.maxDate = maxDate;
        element.pageNum = source.currentPage;
        element.pageCount = source.pageCount;
        element.totalItems = source.totalItems;
        settings.itemsPerPage = source.itemsPerPage;

        element.originalData = structuredClone(source.data);
        const order = getOrder(`page${element.pageNum}_dragAndSortOrder`);
        element.data = core.reOrderData(source.data, order);
      },

      reOrderData: (data, _newOrder) => {
        if (!settings.rememberHeaderOrder || !_newOrder.length) return data;
        const newOrder = _newOrder.map(id => parseInt(id.replace("rowheader", "")));
        return data.sort((a, b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id));
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

        // const [minDate, maxDate] = padMinMaxDatesByScale(element.minDate, element.maxDate, settings.scale);
        // console.log(`minDate: ${new Date(element.minDate)} => padded: ${minDate}\nmaxDate: ${new Date(element.maxDate)} => padded: ${maxDate}`);
        // element.dateStart = minDate;
        // element.dateEnd = maxDate;

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
        element.gantt.get(0).style.setProperty("--bar-height", tools.getCellSize() * 0.8 + "px");

        $(element).empty().append(element.gantt);

        element.canScroll = $dataPanel.width() > $rightPanel.width();

        element.gantt.append(core.navigation(element));

        core.fillData(element, $dataPanel, $leftPanel);

        // save the current zoom level to the local storage
        if (settings.rememberZoomLevel) {
          localStorage.setItem(settings.zoomLevelKey, settings.scale);
        }

        // Scroll the grid to today's date
        if (settings.scrollToToday) {
          core.navigateTo(element, "now");
          // or, scroll the grid to the left most date in the panel
        } else {
          core.updateProgressAndScroll(element, 0);
        }

        $dataPanel.css({ height: $leftPanel.height() });
        new DragAndSort(".fn-gantt .leftPanel .row-list", {
          enableOrderSaving: settings.rememberHeaderOrder,
          onSort: function (order) {
            element.data = core.reOrderData(element.data, order);
            core.render(element);
          },
          lsKeyName: `page${element.pageNum}_dragAndSortOrder`,
        });
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
          return $(`<li class="row fn-label row${i} ${entry.cssClass || ""}" ${dataId} 
            id="rowheader${entry.id}" data-offset="${offset}">
            ${entry.name || ""} ${entry.desc ? "(" + entry.desc + ")" : ""}
          </li>`).on("click", e => e.currentTarget.classList.toggle("selected"));
        });
        const rowList = $('<ul class="row-list"/>');
        // return ganttLeftPanel.append(rowList.append(entries.join("")));
        return ganttLeftPanel.append(rowList.append(entries));
      },

      // Create and return the data panel element
      dataPanel: function (element, width) {
        var dataPanel = $('<div class="dataPanel" style="width: ' + width + 'px;"/>');

        $(element).on("wheel", e => core.wheelScroll(element, e));

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
            case "every hour":
            case "every 3 hours":
            case "every 6 hours":
            case "every 8 hours":
            case "half days":
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
          case "half days":
          case "every 8 hours":
          case "every 6 hours":
          case "every 3 hours":
          case "every hour":
          case "hours":
            const step = SCALE_HOUR_STEPS[settings.scale];
            // range = getHourlyTimeRange(element.dateStart, element.dateEnd, step);
            range = tools.parseTimeRange(element.dateStart, element.dateEnd, step);
            dataPanelWidth = range.length * tools.getCellSize();

            year = range[0].getFullYear();
            month = range[0].getMonth();
            day = range[0];

            for (i = 0, len = range.length; i < len; i++) {
              rday = range[i];

              // Fill years
              var rfy = rday.getFullYear();
              if (rfy !== year) {
                yearArr.push(header_year(tools.getCellSize() * scaleUnitsThisYear, year));

                year = rfy;
                scaleUnitsThisYear = 0;
              }
              scaleUnitsThisYear++;

              // Fill months
              var rm = rday.getMonth();
              if (rm !== month) {
                monthArr.push(header_month(tools.getCellSize() * scaleUnitsThisMonth, settings.months[month]));

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
        const sortBarOrderClickHandler = e => core.sortBars(element);
        const pageSizeChangeHandler = e => {
          const newPageSize = parseInt(e.target.value);
          settings.itemsPerPage = newPageSize;
          settings.onPageSizeChange(newPageSize, element.pageNum).then(data => {
            if (!data) return;
            core.setData(element, data);
            core.init(element);
          });
        };
        const pageBackClickHandler = e => core.navigatePage(element, -1);
        const pageNextClickHandler = e => core.navigatePage(element, 1);
        const nowClickHandler = e => core.navigateTo(element, "now");
        const prevWeekClickHandler = e => {
          const navAmount = getNavigationValues("prevWeek", settings.scale, tools.getCellSize());
          core.navigateTo(element, navAmount);
        };
        const prevDayClickHandler = e => {
          const navAmount = getNavigationValues("prevDay", settings.scale, tools.getCellSize());
          core.navigateTo(element, navAmount);
        };
        const nextDayClickHandler = e => {
          const navAmount = getNavigationValues("nextDay", settings.scale, tools.getCellSize());
          core.navigateTo(element, navAmount);
        };
        const nextWeekClickHandler = e => {
          const navAmount = getNavigationValues("nextWeek", settings.scale, tools.getCellSize());
          core.navigateTo(element, navAmount);
        };
        const zoomInClickHandler = e => core.zoomInOut(element, -1);
        const zoomOutClickHandler = e => core.zoomInOut(element, 1);

        ganttNavigate = $(NAVIGATION_TEMPLATE)
          .find("#sort-bar-order")
          .on("click", sortBarOrderClickHandler)
          .end()
          .find("#pageSize")
          .on("change", pageSizeChangeHandler)
          .val(settings.itemsPerPage)
          .end()
          .find("#pageInfo span")
          .text(`${element.pageNum} / ${element.pageCount}`)
          .end()
          .find("#page-back")
          .on("click", pageBackClickHandler)
          .end()
          .find("#page-next")
          .on("click", pageNextClickHandler)
          .end()
          .find("#current-time")
          .on("click", nowClickHandler)
          .end()
          .find("#prev-week")
          .on("click", prevWeekClickHandler)
          .end()
          .find("#prev-day")
          .on("click", prevDayClickHandler)
          .end()
          .find("#next-day")
          .on("click", nextDayClickHandler)
          .end()
          .find("#next-week")
          .on("click", nextWeekClickHandler)
          .end()
          .find("#zoom-in")
          .on("click", zoomInClickHandler)
          .end()
          .find("#zoom-out")
          .on("click", zoomOutClickHandler)
          .end()
          .find("#csvForm")
          .on("submit", async e => {
            e.preventDefault();
            const file = e.target.csv.files[0];
            const holidays = await parseCSVDates(file);
            if (!holidays || !holidays.length) return;
            settings.holidays = holidays;
            core.render(element);
          })
          .end();
        core.progressBarHandlers(element, ganttNavigate);
        return $('<div class="bottom"></div>').append(ganttNavigate);
      },

      progressBarHandlers: function (element, ganttNavigate) {
        const progressContainer = ganttNavigate.find("#progress");

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

      /**
       * Return an element representing a progress of position within the entire chart
       * @param {import("./helpers/initials.js").Value} day */
      createBar: function (day) {
        const bar = $(`<div class="bar"><div class="fn-label">${day.label}</div></div>`);

        if (!day.from) bar.addClass("noStart");
        if (!day.to) bar.addClass("noEnd");
        if (day.from && day.to) bar.resize = new Resizer(bar.get(0), settings.barOptions.resizability);
        bar.movable = new Movable(bar.get(0), settings.barOptions.movability);
        const l = d => dateToScale(d, settings.scale);
        const content = `${day.label} (${l(day.from)} - ${l(day.to)})`;
        bar.tooltip = new Tooltip(bar.get(0), { content, position: "top", title: day.label });

        if (day.classNames) bar.addClass(day.classNames);
        bar.on("click", e => {
          e.stopPropagation();
          settings.onItemClick(bar.data("dataObj"));
        });
        return bar;
      },

      // **Fill the Chart**
      // Parse the data and fill the data panel
      fillData: function (element, datapanel, leftpanel /* <- never used? */) {
        var cellWidth = tools.getCellSize();
        var barOffset = (cellWidth - tools.getBarHeight()) / 2;
        // Loop through the values of each data element and set a row
        $.each(element.data, function (i, entry) {
          const headerTopOffset = $(element)
            .find("#rowheader" + entry.id)
            .data("offset");
          $.each(entry.values, function (j, day) {
            if (!day.from && !day.to) return;

            const bar = core.createBar(day);
            const originalBarData = element.originalData?.find(e => e.id === entry.id)?.values[j];
            bar.data("dataObj", { ...day, originalBarData: originalBarData });
            let endOffset = 0,
              cellCount = 1;
            let headerCount = 1,
              startOffset = 0,
              barWidth = 0;

            let dummyDate = null; // used for calculating the bar width when one of the dates is missing
            if (!day.from) {
              dummyDate = adjustDate(day.to, -5, settings.scale);
            }

            if (!day.to) {
              dummyDate = adjustDate(day.from, 5, settings.scale);
            }

            switch (settings.scale) {
              // **Hourly data**
              case "hours":
              case "every hour":
              case "every 3 hours":
              case "every 6 hours":
              case "every 8 hours":
              case "half days":
                const step = SCALE_HOUR_STEPS[settings.scale];
                const dFrom = tools.genId(tools.dateDeserialize(day.from || dummyDate), step);
                const from = $(element).find("#dh-" + dFrom);
                const dTo = tools.genId(tools.dateDeserialize(day.to || dummyDate), step);
                const to = $(element).find("#dh-" + dTo);
                startOffset = from.data("offset");
                endOffset = to.data("offset");
                cellCount = Math.floor((endOffset - startOffset) / cellWidth) + 1;
                barWidth = cellWidth * cellCount - 1;
                headerCount = 5;
                break;

              // **Weekly data**
              case "weeks":
                startOffset = $(element)
                  .find(`#${new Date(day.from || dummyDate).getWeekId()}`)
                  .data("offset");
                endOffset = $(element)
                  .find(`#${new Date(day.to || dummyDate).getWeekId()}`)
                  .data("offset");

                cellCount = Math.round((endOffset - startOffset) / cellWidth) + 1;
                barWidth = cellWidth * cellCount;

                headerCount = 3;
                break;

              // **Monthly data**
              case "months":
                startOffset = $(element)
                  .find(`#dh-${getMonthId(new Date(day.from || dummyDate))}`)
                  .data("offset");
                endOffset = $(element)
                  .find(`#dh-${getMonthId(new Date(day.to || dummyDate))}`)
                  .data("offset");
                cellCount = Math.floor((endOffset - startOffset) / cellWidth) + 1;
                barWidth = cellWidth * cellCount;
                headerCount = 2;
                break;

              // **Days**
              case "days":
              /* falls through */
              default:
                startOffset = $(element)
                  .find("#dh-" + tools.genId(day.from || dummyDate))
                  .data("offset");
                endOffset = $(element)
                  .find("#dh-" + tools.genId(day.to || dummyDate))
                  .data("offset");
                cellCount = Math.floor((endOffset - startOffset) / cellWidth) + 1;
                barWidth = cellWidth * cellCount;

                headerCount = 4;

              // console.log(
              //   `label: ${day.label}, from: ${day.from}, to: ${day.to}, cellCount: ${cellCount}`,
              //   new Date(new Date(day.from).setDate(new Date(day.from).getDate() + cellCount))
              // );
            }

            bar.css({
              top: cellWidth * headerCount + barOffset + headerTopOffset,
              left: Math.floor(startOffset),
              width: barWidth + "px",
            });
            datapanel.append(bar);

            // bar.on("resize", e => {
            //   const l = d => dateToScale(d, settings.scale);
            //   const dataObj = bar.data("dataObj");
            //   // console.log("dataObj", dataObj);

            //   const cellsChanged = Math.ceil(e.detail.delta / cellWidth);
            //   if (cellsChanged === 0) return;
            //   settings.onBarResize(dataObj, e.detail.width);
            //   const resizedDay = { ...dataObj, to: adjustDate(dataObj.to, cellsChanged, settings.scale) };
            //   const has_original_data_changed =
            //     resizedDay.originalBarData && l(resizedDay.originalBarData.to) !== l(resizedDay.to);
            //   bar.attr("data-resized", has_original_data_changed);
            //   bar.data("dataObj", resizedDay);
            //   element.data[i].values[j] = resizedDay;

            //   const content = has_original_data_changed
            //     ? `${resizedDay.label} (${l(resizedDay.from)} - ${l(resizedDay.to)})\n${cellsChanged} ${settings.scale}`
            //     : `${resizedDay.label} (${l(resizedDay.from)} - ${l(resizedDay.to)})`;
            //   bar.tooltip.refresh({ content });
            // });
            bar.on("resize", e => {
              const l = d => dateToScale(d, settings.scale);
              const dataObj = bar.data("dataObj");
              // console.log("dataObj", dataObj);

              const cellsChanged = Math.ceil(e.detail.delta / cellWidth);
              if (cellsChanged === 0) return;
              
              settings.onBarResize(dataObj, e.detail.width);
              const resizedDay = { ...dataObj, to: adjustDate(dataObj.to, cellsChanged, settings.scale) };
              const has_original_data_changed =
                resizedDay.originalBarData && l(resizedDay.originalBarData.to) !== l(resizedDay.to);
              bar.attr("data-resized", has_original_data_changed);
              bar.data("dataObj", resizedDay);
              element.data[i].values[j] = resizedDay;

              const difference = getScaledDifference(resizedDay.originalBarData.to, resizedDay.to, settings.scale);

              const content = has_original_data_changed
                ? `${resizedDay.label} (${l(resizedDay.from)} - ${l(resizedDay.to)})\n${difference}`
                : `${resizedDay.label} (${l(resizedDay.from)} - ${l(resizedDay.to)})`;
              bar.tooltip.refresh({ content });
            });
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
        settings.onGetPage(nextPage, settings.itemsPerPage).then(data => {
          core.setData(element, data);
          core.init(element);
        });
      },

      // Sort bars
      sortBars: function (element) {
        // /** @type {typeof settings.source} */
        const selectedIds = $(element)
          .find(".fn-gantt ul.row-list li.selected")
          .map((i, el) => parseInt(el.id.replace("rowheader", "")))
          .toArray();
        if (element.preSortData === undefined) {
          element.preSortData = structuredClone(element.data);
          let selectedData = element.data.filter(d => selectedIds.includes(d.id));
          selectedData = selectedData.length ? selectedData : element.data;
          selectedData = selectedData.filter(d => d.values.some(v => v.from && v.to)); // remove bars with no start or end date
          let last_date = null;
          selectedData.forEach(entry => {
            entry.values.forEach(val => {
              if (!val.from || !val.to) return; // skip bars with no start or end date
              const ONE_CELL_VALUE = getOneScaleValue(settings.scale);
              // console.log(`ONE_CELL_VALUE: ${ONE_CELL_VALUE}, scale: ${settings.scale}`);
              if (!last_date) {
                last_date = val.to + ONE_CELL_VALUE; // add an hour to the first date
                return;
              }
              const diff = val.to - val.from;
              val.from = last_date;
              val.to = last_date + diff;
              last_date = val.to + ONE_CELL_VALUE; // add an hour to the last date
            });
          });
          const startDate = new Date(selectedData[0].values[0].from);
          const endDate = new Date(
            selectedData[selectedData.length - 1].values[selectedData[selectedData.length - 1].values.length - 1].to
          );
          console.log(`work days: ${countWorkDays(startDate, endDate, settings.holidays)}`);
          core.init(element);
          // $(element).find(".fn-gantt .nav-sort-bar-order span").text("キャンセル");
          // readd selected class to the rows
          selectedIds.forEach(id => $(element).find(`#rowheader${id}`).addClass("selected"));
        } else {
          element.data = structuredClone(element.preSortData);
          element.preSortData = undefined;
          core.init(element);
          // $(element).find(".fn-gantt .nav-sort-bar-order span").text("続けて表示");
        }
      },

      // Change zoom level
      zoomInOut: function (element, val) {
        var zoomIn = val < 0;

        const { headers, nextScale } = getNextZoomScale(settings.scale, zoomIn);
        if (!nextScale) return console.log("No more zoom levels to navigate to");
        settings.scale = nextScale;
        element.headerRows = headers;

        // save the new scale to local storage
        if (settings.rememberZoomLevel) {
          localStorage.setItem(settings.zoomLevelKey, settings.scale);
        }
        core.init(element);
      },

      // Move chart via mousewheel
      wheelScroll: function (element, e) {
        if (!element.canScroll || !e.shiftKey) return; // only scroll when shift key is pressed
        e.preventDefault(); // e is a jQuery Event
        const ctrlKey = e.ctrlKey || e.metaKey || e.originalEvent.ctrlKey || e.originalEvent.metaKey;
        // https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent/deltaY
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sign
        const deltaY = Math.sign(e.deltaY || e.originalEvent.deltaY) || 0;
        let step = ctrlKey ? deltaY * 5 : deltaY * 1; // faster scroll if ctrl(meta) is pressed

        if (HOUR_SCALES.includes(settings.scale))
          step *= 0.25; // slower scroll for hours

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
            if (!date.to) return;
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
          case "every hour":
          case "every 3 hours":
          case "every 6 hours":
          case "every 8 hours":
          case "half days":
            const step = SCALE_HOUR_STEPS[settings.scale];
            maxDate.setHours(Math.ceil(maxDate.getHours() / step) * step);
            maxDate.setHours(maxDate.getHours() + step * 3);
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
            if (!date.from) return;
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
          case "every hour":
          case "every 3 hours":
          case "every 6 hours":
          case "every 8 hours":
          case "half days":
            const step = SCALE_HOUR_STEPS[settings.scale];
            minDate.setHours(Math.floor(minDate.getHours() / step) * step);
            minDate.setHours(minDate.getHours() - step * 3);
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
      parseTimeRange: function (from, to, step) {
        var year = from.getFullYear();
        var month = from.getMonth();
        var date = from.getDate();
        var hour = from.getHours();
        hour -= hour % step;
        var range = [],
          h = 0,
          i = 0;
        do {
          range[i] = new Date(year, month, date, hour + h++ * step);
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
          case "every hour":
          case "every 3 hours":
          case "every 6 hours":
          case "every 8 hours":
          case "half days":
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

      /**
       * Returns true when the given date appears in the array of holidays, if provided
       * @param {number} date - date in milliseconds */
      isHoliday: function (date) {
        if (!settings.holidays || !settings.holidays.length) return false;
        return settings.holidays.some(holiday => areDatesEqual(date, holiday));
      },

      getCellSize: () => settings.cellSize,

      getBarHeight: () => tools.getCellSize() * 0.8,

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
      this.originalData = null; // original data before sorting, modifications, etc.

      // check if local storage has the zoom level saved
      if (settings.rememberZoomLevel) {
        const zoomLevel = localStorage.getItem(settings.zoomLevelKey);
        if (zoomLevel) {
          settings.scale = zoomLevel;
        } else {
          localStorage.setItem(settings.zoomLevelKey, settings.scale);
        }
      }

      this.headerRows = SCALE_HEADER_COUNT[settings.scale];
      this.canScroll = true;
      this.gantt = null;
      core.create(this);
    });
  };
}

main();
export default {};

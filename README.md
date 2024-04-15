<p align="center">
  <a href="https://github.com/uzbeki/jquery-gantt-chart#readme" target="_blank">
    <img src="https://github.com/uzbeki/jquery-gantt-chart/blob/main/logo.png" alt="jQuery Gantt Chart" style="border-radius:50%;"/><br/>
  </a>
    jQuery Gantt Chart is a simple and fast plugin that implements gantt functionality as a jQuery component.
</p>

<div align="center">

[![GitHub release](https://img.shields.io/github/release/uzbeki/jquery-gantt-chart.svg)](https://github.com/uzbeki/jquery-gantt-chart/releases)
[![Npm package version](https://badgen.net/npm/v/@uzbeki/jquery-gantt-chart)](https://www.npmjs.com/package/@uzbeki/jquery-gantt-chart)
[![GitHub license](https://img.shields.io/github/license/uzbeki/jquery-gantt-chart.svg)](https://github.com/uzbeki/jquery-gantt-chart/blob/main/LICENSE)
[![Npm package total downloads](https://badgen.net/npm/dt/@uzbeki/jquery-gantt-chart)](https://npmjs.com/package/@uzbeki/jquery-gantt-chart)
[![](https://data.jsdelivr.com/v1/package/npm/@uzbeki/jquery-gantt-chart/badge)](https://www.jsdelivr.com/package/npm/@uzbeki/jquery-gantt-chart)

![jQuery](https://img.shields.io/badge/jquery-%230769AD.svg?style=for-the-badge&logo=jquery&logoColor=white)

</div>

## [Demo and Documentation](https://github.com/uzbeki/jquery-gantt-chart/)
This is a fork of the original [jquery-gantt](https://github.com/taitems/jQuery.Gantt). It was not maintained for a long time and I decided to fork it and make it work with modern browsers and jQuery versions. I also added some new features and fixed some bugs.

- Live Demo: [https://uzbeki.github.io/jquery-gantt-chart/](https://uzbeki.github.io/jquery-gantt-chart/)
- Repository: [https://github.com/uzbeki/jquery-gantt-chart](https://github.com/uzbeki/jquery-gantt-chart)
- NPM page: [https://www.npmjs.com/package/@uzbeki/jquery-gantt-chart](https://www.npmjs.com/package/@uzbeki/jquery-gantt-chart)
- Github package: [https://github.com/uzbeki/jquery-gantt-chart/pkgs/npm/jquery-gantt-chart](https://github.com/uzbeki/jquery-gantt-chart/pkgs/npm/jquery-gantt-chart)

## Installation
- Git clone
- `yarn add @uzbeki/jquery-gantt-chart`, or
- `npm install @uzbeki/jquery-gantt-chart` 

## About

jQuery Gantt Chart is a modern and fast plugin that implements gantt functionality as 
a jQuery component with JS Module support.

Plugin was tested and should work on:
All major browsers that support ES6 or above.


## Features:
- 📟 Pagination support, page data handler set inside `onGetPage` option
- 👉 Customizable cell size with `cellSize` option
- 🎨 Customizable task(bar) colors with `data[i].values[j].customClass`
- 🏷️ Display short description as hints
- 🖱️ Scroll with `Shift+mouseWheel`, or faster scroll with `Ctrl+Shift+mouseWheel`
- 📅 Mark holidays or today
- 🔍 Zoom in/out
- Drag Sortable Header Support
- 🆕 ES Module support
- 🆕 Remember Zoom Level and Header Order (page by page remembering)
- 🆕 Resizable Bars from both **left** and **righ** ends with `barOptions.resizability` options
- 🆕 Movable Bars (**vertial** and **horizontal** support) with `barOptions.movability` options
- 🆕 Easy to sort bars to align them one after the another

## Requirements:
- jQuery v1.10.2 or above:
```html
<script defer src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
```

## Usage
Simply include the plugin and its stylesheet in your html file and call it on a div element. 

```html
<link rel="stylesheet" href="./src/jquery.gantt.css">
<script type="module" src="./src/index.js"></script>
```

<!-- Simply include the plugin in your html file and call it on a div element. 

### Download the plugin and include it in your html file

```html
<link rel="stylesheet" href="../dist/jquery.gantt.min.css">
<script defer src="../dist/jquery.gantt.min.js"></script>
```

### Or use CDN
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@uzbeki/jquery-gantt-chart/dist/jquery.gantt.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/@uzbeki/jquery-gantt-chart/dist/jquery.gantt.min.js"></script>
``` -->

### Create a div element and call the plugin on it
```js
<script type="module">
  $("#gantt").gantt({
      source: data, // json data
      scale: "days",
      onItemClick: console.log,
      onAddClick: console.log,
      onRender: () => console.log("chart rendered"),
      onGetPage: (page) => yourPageHandler(page),
    });
</script>
```

## Customizable Options
- `source` - json data, defaults to `{}`
- `scrollToToday` - scroll to today, defaults to `true`
- `zoomLevelKey` - key to save zoom level, defaults to `jquery-gantt-chart-zoom-level`
- `rememberZoomLevel` - remember current zoom level, defaults to `true`
- `rememberHeaderOrder` - remember header order, defaults to `true`
- `scale` - scale type (hours, days, weeks, months), defaults to `days`
- `maxScale` - maximum scale, defaults to `months`
- `minScale` - minimum scale, defaults to `hours`
- `cellSize` - cell size in pixels, defaults to `24`
- `holidays` - array of holidays, defaults to `[]`
- `itemsPerPage` - items per page, defaults to `10`
- `dow` - days of week, defaults to `["S", "M", "T", "W", "T", "F", "S"]`
- `months` - months, defaults to `["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]`
- `barOptions` - bar options, defaults to [DefaultBarOptions](#defaultbaroptions)
  - `resizability` - bar resizability, defaults to [DefaultBarOptions.resizability](#defaultbaroptions)
  - `movability` - bar movability, defaults to [DefaultBarOptions.movability](#defaultbaroptions)
- `onItemClick` - callback on item click, called with item object
- `onAddClick` - callback on add button click, called with date and row data
- `onRender` - callback on chart render
- `onGetPage` - callback on page change, called with page number

`source` is an object of the following type
```ts
type SourceData = {
  data: Array<{
    id: number;
    name: string;
    desc: string;
    values: Array<{
      from: Date;
      to: Date;
      label: string;
      desc: string;
      customClass: string; // for coloring bars
    }>;
  }>;
  // pagination
  currentPage: number;
  pageCount: number;
  itemsPerPage: number;
};
```

### DefaultBarOptions
```ts
const DefaultBarOptions = {
  resizability: {
    minWidth: DEFAULT_CELL_SIZE, // 24
    maxWidth: Infinity, // maximum width
    onResize: newWidth => {}, // callback on resize
    stepSize: DEFAULT_CELL_SIZE, // 24
    handleVisibility: "hover", // "hover" | "click" | "always"
    leftHandle: false, // show left handle to resize
    rightHandle: true, // show right handle to resize
  },
  movability: {
    stepSize: DEFAULT_CELL_SIZE, // 24
    horizontal: true, // allow horizontal movement
    vertical: false, // allow vertical movement
    minX: 0, // minimum x position
    minY: 0, // minimum y position
    maxX: Number.POSITIVE_INFINITY, // maximum x position
    maxY: Number.POSITIVE_INFINITY, // maximum y position
  };
};
```

## License
MIT


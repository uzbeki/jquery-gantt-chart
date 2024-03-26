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

jQuery Gantt Chart is a simple and fast plugin that implements gantt functionality as 
a jQuery component.

Plugin was tested and should work on:
All major browsers that support ES6 or above.


## Features:
- 📟Pagination support, page data handler set inside `onGetPage` option
- Customizable cell size with `cellSize` option
- 🎨 Customizable task(bar) colors with `data[i].values[j].customClass`
- ℹ️ Display short description as hints
- 🖱️ Scroll with `Shift+mouseWheel`, or faster scroll with `Ctrl+Shift+mouseWheel`
- 📅 Mark holidays or today
- 🔍 Zoom in/out

## Requirements:
- jQuery v1.10.2 or above:
```html
<script defer src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
```

## Usage
Simply include the plugin in your html file and call it on a div element. 

### Download the plugin and include it in your html file

```html
<link rel="stylesheet" href="../dist/jquery.gantt.min.css">
<script defer src="../dist/jquery.gantt.min.js"></script>
```

### Or use CDN
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@uzbeki/jquery-gantt-chart/dist/jquery.gantt.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/@uzbeki/jquery-gantt-chart/dist/jquery.gantt.min.js"></script>
```

### Create a div element and call the plugin on it
```js
$("#gantt").gantt({
    source: data, // json data
    scale: "days",
    onItemClick: console.log,
    onAddClick: console.log,
    onRender: () => console.log("chart rendered"),
    onGetPage: (page) => yourPageHandler(page),
  });
```

## Customizable Options
- `source` - json data, defaults to `{}`
- `navigate` - navigation type (buttons, scroll), defaults to `scroll`
- `scrollToToday` - scroll to today, defaults to `true`
- `cookieKey` - cookie key, defaults to `jquery-gantt-chart`
- `useCookie` - use cookie to save last view, defaults to `false`
- `scale` - scale type (hours, days, weeks, months), defaults to `days`
- `maxScale` - maximum scale, defaults to `months`
- `minScale` - minimum scale, defaults to `hours`
- `cellSize` - cell size in pixels, defaults to `24`
- `holidays` - array of holidays, defaults to `[]`
- `itemsPerPage` - items per page, defaults to `10`
- `dow` - days of week, defaults to `["S", "M", "T", "W", "T", "F", "S"]`
- `months` - months, defaults to `["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]`
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

## License
MIT


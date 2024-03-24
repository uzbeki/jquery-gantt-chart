## [Demo and Documentation](https://github.com/uzbeki/jquery-gantt-chart/)
This is a fork of the original [jquery-gantt](https://github.com/taitems/jQuery.Gantt). It was not maintained for a long time and I decided to fork it and make it work with modern browsers and jQuery versions. I also added some new features and fixed some bugs.

## Installation
- Git clone
- `yarn add @uzbeki/jquery-gantt-chart`, or
- `npm install @uzbeki/jquery-gantt-chart` 

## About

jQuery Gantt Chart is a simple chart that implements gantt functionality as 
a jQuery component.

It's able to:
 - Pagination
 - Display different colours for each task
 - Display short description as hints
 - Mark holidays

Plugin was tested and should work on:
All major browsers that support ES6 or above.

## Requirements:
- jQuery v1.10.2 or above
## Usage
Simply include the plugin in your html file and call it on a div element. 
```js
$("#gantt").gantt({
    source: data, // json data
    navigate: "scroll", // buttons, scroll
    scale: "days",
    cellSize: 26,
    onItemClick: console.log,
    onAddClick: console.log,
    onRender: () => console.log("chart rendered"),
    onGetPage: generateDummyData,
  });
```

## Options
- `source` - json data
- `navigate` - navigation type (buttons, scroll)
- `scale` - scale type (hours, days, weeks, months)
- `cellSize` - cell size in pixels
- `onItemClick` - callback on item click
- `onAddClick` - callback on add button click
- `onRender` - callback on chart render
- `onGetPage` - callback on page change

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


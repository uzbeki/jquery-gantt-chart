/**
 * Generates dummy data for a Gantt chart.
 * @param {number} [page=1] - The page number.
 * @returns {Promise<{
 *   data: Array<{
 *     id: number,
 *     name: string,
 *     desc: string,
 *     values: Array<{
 *       from: Date,
 *       to: Date,
 *       label: string,
 *       desc: string,
 *       customClass: string
 *     }>
 *   }>,
 *   currentPage: number,
 *   pageCount: number,
 *   itemsPerPage: number
 * }>} The generated dummy data.
 */
const generateDummyData = async (page = 1) => {
  const generateRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
  const totalPages = 10;
  const itemsPerPage = 10;
  if (page > totalPages) {
    return { data: [], currentPage: page, pageCount: totalPages, itemsPerPage: 10 };
  }
  const data = [];
  for (let i = 1; i <= itemsPerPage; i++) {
    const values = Array.from({ length: generateRandomNumber(1, 100) }, (_, j) => {
      const thisYear = generateRandomNumber(2024, 2025);
      const randomMonth = generateRandomNumber(1, 12);
      const randomFrom = new Date(thisYear, randomMonth, generateRandomNumber(1, 10) + j + page * 10);
      const randomTo = new Date(thisYear, randomMonth, generateRandomNumber(10, 25) + j + page * 10);

      return {
        from: randomFrom,
        to: randomTo,
        label: `Task ${j}`,
        desc: `Task ${j} description`,
        customClass: "ganttRed",
      };
    });

    data.push({
      id: i,
      name: `Sprint ${i}`,
      desc: `Description ${i}`,
      values,
    });
  }
  return { data, currentPage: page, pageCount: totalPages, itemsPerPage: itemsPerPage };
};

generateDummyData(1).then(data => {
  $("#gantt").gantt({
    source: data,
    navigate: "scroll", // buttons, scroll
    scale: "days",
    cellSize: 26,
    onItemClick: console.log,
    onAddClick: console.log,
    onRender: () => console.log("chart rendered"),
    onGetPage: generateDummyData,
  });
  
  // if bootstrap bundle is included
  // $('.bar').popover({
  //   trigger: "hover",
  //   html: true,
  // });
});

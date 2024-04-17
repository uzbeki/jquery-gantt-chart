import scheduleData from "./schedule.js";
import randomData from "./random.js";
import testPlanData from "./testPlans.js";

const getGanttData = async (page = 1, itemsPerPage = 10, data = scheduleData) => {
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return {
    data: data.slice(start, end),
    currentPage,
    pageCount: totalPages,
    itemsPerPage,
    totalItems: data.length,
  };
};

export const getScheduleData = async (page = 1, itemsPerPage = 10) => {
  return getGanttData(page, itemsPerPage, scheduleData);
};

export const getRandomData = async (page = 1, itemsPerPage = 10) => {
  return getGanttData(page, itemsPerPage, randomData);
};

export const getTestPlanData = async (page = 1, itemsPerPage = 10) => {
  const data = testPlanData.map(item => {
    return {
      id: item.id,
      name: item.project_name,
      desc: item.target_name,
      values: [
        {
          from: item.start_date,
          to: item.completion_date,
          label: item.project_name,
          desc: item.target_name,
          customClass: "ganttBlue",
        },
      ],
    };
  });
  return getGanttData(page, itemsPerPage, data);
};

export const generateDummyData = async (page = 1, itemsPerPage = 10) => {
  const generateRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
  const totalPages = 10;
  // const itemsPerPage = 10;
  if (page > totalPages) {
    return { data: [], currentPage: page, pageCount: totalPages, itemsPerPage };
  }
  const data = [];
  for (let i = 1; i <= itemsPerPage; i++) {
    // const values = Array.from({ length: generateRandomNumber(1, 100) }, (_, j) => {
    const values = Array.from({ length: 3 }, (_, j) => {
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
  return { data, currentPage: page, pageCount: totalPages, itemsPerPage };
};
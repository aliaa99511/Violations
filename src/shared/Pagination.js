import functions from "./functions";

// let pagination = {}
// pagination.currentPage = 1;

// pagination.draw = (parent,TotalPages, TotalRows) => {
//     let holder = $(parent);

//     // let pagesCount = Math.ceil(Number(total) / Number(pageLength));
//     holder.attr("current", pagination.currentPage)
//     holder.attr("total", TotalRows)
//     let pages = ''
//     for (let i = 1; i <= TotalPages; i++) {
//         pages += `<div class="page page-item">${i}</div>`
//     }
//     holder.append(`
//         <div class="page-item prev-page">►</div>
//         <div class="pages-holder"> ${pages} </div>
//         <div class="page-item next-page">◄</div>
//     `);
// }

// pagination.start = (parent, callback) => {
//     let holder = $(parent);
//     // let pages = document.querySelectorAll(`${parent} .page`)
//     let pages = $(`${parent} .page`)
//     console.log(pages)
//     pages.each((index,page) => {
//         let jqPage = $(page)
//         console.log(jqPage)
//         jqPage.on("click", (e) => {
//             if (Number(jqPage.text()) != Number(pagination.currentPage)) {
//                 pagination.currentPage = jqPage.text()
//                 callback(jqPage.text())()
//                 holder.attr("current", jqPage.text())
//                 jqPage.addClass("active")
//             }
//         })
//     })
//     // next page

//     let next = holder.find(`.next-page`);
//     next.on("click", (e) => {
//         let total = holder.attr("total");
//         if (Number(pagination.currentPage) < Number(total)) {
//             callback(Number(pagination.currentPage) + 1)()
//             pagination.currentPage = Number(pagination.currentPage) + 1
//         }
//     })
//     // previous page
//     let previous = holder.find(`.prev-page`);
//     previous.on("click", () => {
//         if (Number(pagination.currentPage) > 1) {
//             callback(Number(pagination.currentPage) - 1)()
//             pagination.currentPage = Number(pagination.currentPage) - 1
//         }
//     })

// }

// pagination.reset = () => {
//     pagination.currentPage = 1;
//     let pages = $("#paginationID .page")

//     if (pages.length > 0) {
//         pages.forEach(p => {
//             if (p.text() == "1") {
//                 p.addClass("active")
//             } else {
//                 p.removeClass("active")
//             }
//         })
//     }
// }

// pagination.scrollToElement = (el, length) => {
//     const elLeft = el.offsetLeft + el.offsetWidth;
//     const elParentLeft = el.parentNode.offsetLeft + el.parentNode.offsetWidth;

//     // check if element not in view
//     if (elLeft >= elParentLeft + el.parentNode.scrollLeft) {
//         el.parentNode.scrollLeft = elLeft - elParentLeft;
//     } else if (elLeft <= el.parentNode.offsetLeft + el.parentNode.scrollLeft) {
//         el.parentNode.scrollLeft = el.offsetLeft - el.parentNode.offsetLeft * (length / 10);
//     }
// }

// pagination.activateCurrentPage = () => {
//     let pages = $("#paginationID .page")
//     pages.each((index,page) => {
//         let jqPage = $(page)
//         if (Number(jqPage.text()) == Number(pagination.currentPage)) {
//             jqPage.addClass("active")
//             pagination.scrollToElement(jqPage, pages.length)
//         } else {
//             jqPage.removeClass("active")
//         }

//     })
// }

// export default pagination

let pagination = {};
pagination.currentPage = 1;

pagination.draw = (parent, total, pageLength) => {
  let holder = document.querySelector(parent);

  // let pagesCount = Math.ceil(Number(total) / Number(pageLength));
  holder.setAttribute("current", pagination.currentPage);
  holder.setAttribute("total", total);
  let pages = "";
  for (let i = 1; i <= total; i++) {
    pages += `<div class="page page-item">${i}</div>`;
  }
  holder.innerHTML = `<div class="pages-holder"> ${pages} </div>`;
};
{
  /* <div class="page-item prev-page">►</div> */
}
{
  /* <div class="page-item next-page">◄</div>`; */
}

pagination.start = (parent, callback) => {
  let holder = document.querySelector(parent);
  let pages = document.querySelectorAll(`${parent} .page`);
  pages.forEach((page) => {
    page.addEventListener("click", (e) => {
      if (Number(page.innerHTML) != Number(pagination.currentPage)) {
        $(".PreLoader").addClass("active");
        pagination.currentPage = page.innerHTML;
        callback(Number(page.innerHTML), true)();
        holder.setAttribute("current", page.innerHTML);
        if (functions.getSiteName() == "ViolationsBranch") {
          page.classList.add("active");
          page.classList.add("activeGreen");
        } else {
          page.classList.add("active");
          page.classList.add("activeBlue");
        }
      }
      if (page.classList.contains("active")) {
        e.preventDefault();
      }
    });
  });

  // next page
  // let next = holder.querySelector(`.next-page`);
  // next.addEventListener("click", () => {
  //     $(".PreLoader").addClass("active");
  //     let total = holder.getAttribute("total");
  //     if (Number(pagination.currentPage) < Number(total)) {
  //         callback(Number(pagination.currentPage) + 1,true)()
  //         pagination.currentPage = Number(pagination.currentPage) + 1
  //         holder.setAttribute("current", pagination.currentPage)
  //     }
  // })

  // // previous page
  // let previous = holder.querySelector(`.prev-page`);
  // previous.addEventListener("click", () => {
  //     $(".PreLoader").addClass("active");
  //     if (Number(pagination.currentPage) > 1) {
  //         callback(Number(pagination.currentPage) - 1,true)()
  //         pagination.currentPage = Number(pagination.currentPage) - 1
  //         holder.setAttribute("current", pagination.currentPage)
  //     }
  // })
};

pagination.reset = () => {
  pagination.currentPage = 1;
  let pages = document.querySelectorAll("#paginationID .page");

  if (pages.length > 0) {
    pages.forEach((p) => {
      if (p.innerHTML == "1") {
        p.classList.add("active");
      } else {
        p.classList.remove("active");
      }
    });
  }
};

pagination.scrollToElement = (el, length) => {
  const elLeft = el.offsetLeft + el.offsetWidth;
  const elParentLeft = el.parentNode.offsetLeft + el.parentNode.offsetWidth;

  // check if element not in view
  if (elLeft >= elParentLeft + el.parentNode.scrollLeft) {
    el.parentNode.scrollLeft = elLeft - elParentLeft;
  } else if (elLeft <= el.parentNode.offsetLeft + el.parentNode.scrollLeft) {
    el.parentNode.scrollLeft =
      el.offsetLeft - el.parentNode.offsetLeft * (length / 10);
  }
};

pagination.activateCurrentPage = () => {
  let pages = document.querySelectorAll("#paginationID .page");
  pages.forEach((p) => {
    if (Number(p.innerHTML) == Number(pagination.currentPage)) {
      p.classList.add("active");
      pagination.scrollToElement(p, pages.length);
    } else {
      p.classList.remove("active");
    }
  });
};

export default pagination;

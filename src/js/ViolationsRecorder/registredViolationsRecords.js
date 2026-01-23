// import { data } from "jquery";
import functions from "../../Shared/functions";
import DetailsPopup from "../../Shared/detailsPopupContent";
import sharedApis from "../../Shared/sharedApiCall";
import pagination from "../../Shared/Pagination";

let violationRecords = {};

violationRecords.pageIndex = 1;

violationRecords.getViolations = (
  pageIndex = 1,
  destroyTable = false,
  ViolationZone = "",
  ViolationType = 0
) => {
  let request = {
    Data: {
      RowsPerPage: 10,
      PageIndex: Number(pageIndex),
      ColName: "created",
      SortOrder: "desc",
      ViolationType: ViolationType,
      ViolationsZone: ViolationZone,
    },
  };
  console.log(request);
  functions
    .requester(
      "/_layouts/15/Uranium.Violations.SharePoint/Violations.aspx/Search",
      { request }
    )
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      console.log(data);
      $(".PreLoader").removeClass("active");
      let violationsData = [];
      let ItemsData = data.d.Result;
      if (data.d.Result.GridData != null) {
        if (data.d.Result.GridData.length > 0) {
          Array.from(data.d.Result.GridData).forEach((element) => {
            violationsData.push(element);
          });
        } else {
          violationsData = [];
        }
      }
      violationRecords.setPaginations(
        ItemsData.TotalPageCount,
        ItemsData.RowsPerPage
      );
      violationRecords.dashBoardTable(violationsData.reverse(), destroyTable);
      violationRecords.pageIndex = ItemsData.CurrentPage;
    })
    .catch((err) => {
      console.log(err);
    });
};

violationRecords.setPaginations = (TotalPages, RowsPerPage) => {
  pagination.draw("#paginationID", TotalPages, RowsPerPage);
  pagination.start("#paginationID", violationRecords.getViolations);
  // pagination.reset()
  // pagination.scrollToElement(el, length)
  pagination.activateCurrentPage();
};
violationRecords.dashBoardTable = (violationsData, destroyTable) => {
  let data = [];
  let violationData;
  if (violationsData.length > 0) {
    violationsData.forEach((violation) => {
      violationData = violation;
      data.push([
        `<div class="violationId" data-violationid="${violation.ID}" data-offendertype="${violation.OffenderType}">${violation.ViolationCode}</div>`,
        `<div class="violationArName">${functions.getViolationArabicName(
          violation.OffenderType
        )}</div>`,
        `<div class="violationCode">${
          violation.OffenderType == "Quarry"
            ? violation.QuarryCode
            : violation.CarNumber
        }</div>`,
        `<div class="companyName">${violation.ViolatorCompany}</div>`,
        `<div class="violationType" data-typeid="${violation.ViolationTypes.ID}">${violation.ViolationTypes.Title}</div>`,
        `<div class="violationZone">${violation.ViolationsZone}</div>`,
        `${functions.getFormatedDate(violation.ViolationDate)}`,
        `<div class='controls'>
              <div class='ellipsisButton'>
                  <i class='fa-solid fa-ellipsis-vertical'></i>
              </div>
              <div class="hiddenListBox">
                  <div class='arrow'></div>
                  <ul class='list-unstyled controlsList'>
                      <li><a href="#" class="itemDetails"> المزيد من التفاصيل</a></li>
                      <li><a href="#" class="printViolationDetails"> طباعة التقرير</a></li>
                  </ul>
              </div>
          </div`,
      ]);
    });
  }
  let Table = functions.tableDeclare(
    "#ViolationsRecord",
    data,
    [
      { title: "رقم المخالفة", class: "no-sort" },
      { title: "تصنيف المخالفة", class: "no-sort" },
      { title: " رقم المحجر/العربة", class: "no-sort" },
      { title: "إسم الشركة المخالفة", class: "no-sort" },
      { title: "نوع المخالفة ", class: "no-sort" },
      { title: "المنطقة", class: "no-sort" },
      { title: "تاريخ الضبط", class: "sort" },
      { title: "", class: "all no-sort" },
    ],
    false,
    destroyTable
  );
  $(".ellipsisButton").on("click", (e) => {
    $(".hiddenListBox").hide(300);
    $(e.currentTarget).siblings(".hiddenListBox").toggle(300);
  });
  // let ths = Table.columns().nodes().to$()
  // ths.addClass("ammarTest")
  // console.log(ths)
  let violationlog = Table.rows().nodes().to$();
  $.each(violationlog, (index, record) => {
    let jQueryRecord = $(record);
    let violationID = jQueryRecord.find(".violationId").data("violationid");
    let OffenderType = jQueryRecord.find(".violationId").data("offendertype");

    // jQueryRecord.find(".controls").children(".ellipsisButton").on("click", (e) => {
    //   $(".hiddenListBox").hide(300);
    //   $(e.currentTarget).siblings(".hiddenListBox").toggle(300);
    // });
    jQueryRecord
      .find(".controls")
      .children(".hiddenListBox")
      .find(".itemDetails")
      .on("click", (e) => {
        $(".overlay").addClass("active");
        violationRecords.findViolationByID(violationID);
        // violationRecords.getViolationAttachmentsById(violationID);
      });
    jQueryRecord
      .find(".controls")
      .children(".hiddenListBox")
      .find(".printViolationDetails")
      .on("click", (e) => {
        let Content;
        let printBox;
        if (OffenderType == "Quarry") {
          Content = DetailsPopup.quarryDetailsPopupContent(
            violationData,
            "المسجلة"
          );
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          functions.declarePopup(
            ["generalPopupStyle", "detailsPopup"],
            printBox
          );
        } else {
          Content = DetailsPopup.vehicleDetailsPopupContent(
            violationData,
            "المسجلة"
          );
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          functions.declarePopup(
            ["generalPopupStyle", "detailsPopup"],
            printBox
          );
        }
        functions.PrintDetails(e);
      });
  });
  functions.hideTargetElement(".controls", ".hiddenListBox");
};

violationRecords.findViolationByID = (violationID) => {
  let request = {
    Id: violationID,
  };
  functions
    .requester(
      "/_layouts/15/Uranium.Violations.SharePoint/Violations.aspx/FindbyId",
      request
    )
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      let violationData;
      let violationOffenderType;
      let Content;
      let printBox;
      if (data != null) {
        violationData = data.d;
        violationOffenderType = violationData.OffenderType;
        if (violationOffenderType == "Quarry") {
          Content = DetailsPopup.quarryDetailsPopupContent(
            violationData,
            "المسجلة"
          );
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          functions.declarePopup(
            ["generalPopupStyle", "detailsPopup", "blueHeaderPopup"],
            printBox
          );
        } else {
          Content = DetailsPopup.vehicleDetailsPopupContent(
            violationData,
            "المسجلة"
          );
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          functions.declarePopup(
            ["generalPopupStyle", "detailsPopup", "blueHeaderPopup"],
            printBox
          );
          let VehcleType = violationData.VehicleType;
          if (VehcleType == "مقطورة") {
            $(".TrailerNumberBox").show();
          } else {
            $(".TrailerNumberBox").hide();
          }
        }
        $(".printBtn").on("click", (e) => {
          functions.PrintDetails(e);
        });
      } else {
        violationData = null;
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

violationRecords.filterViolationsLog = (e) => {
  let pageIndex = violationRecords.pageIndex;
  let ViolationZoneVal = $("#violationZone").children("option:selected").val();
  let ViolationTypeVal = $("#TypeofViolation")
    .children("option:selected")
    .data("id");
  let ViolationType;
  let ViolationZone;

  if (ViolationTypeVal == "" && ViolationZoneVal == "") {
    functions.warningAlert(
      "من فضلك قم بإدخال قيمة واحدة على الأقل من قيم البحث"
    );
  } else if (ViolationZoneVal != "" || ViolationTypeVal != "0") {
    $(".PreLoader").addClass("active");
    ViolationZone = $("#violationZone").children("option:selected").val();
    ViolationType = Number(
      $("#TypeofViolation").children("option:selected").data("id")
    );
    violationRecords.getViolations(
      pageIndex,
      true,
      ViolationZone,
      ViolationType
    );
  }
};

export default violationRecords;

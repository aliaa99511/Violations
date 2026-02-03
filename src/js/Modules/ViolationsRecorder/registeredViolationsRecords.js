import functions from "../../Shared/functions";
import DetailsPopup from "../../Shared/detailsPopupContent";
import pagination from "../../Shared/Pagination";

let violationRecords = {};
// violationRecords.pageIndex = 1;

violationRecords.dataObj = {
  destroyTable: false,
  OffenderType: "",
  ViolationType: 0,
};

violationRecords.getViolations = (
  pageIndex = 1,
  destroyTable = false,
  // ViolationSector = 1,
  ViolationSector = Number(
    $("#violationSector").children("option:selected").val()
  ),
  ViolationType = Number(
    $("#TypeofViolation").children("option:selected").data("id")
  ),
  ViolationGeneralSearch = ""
) => {
  let UserId = _spPageContextInfo.userId;
  const theCode =
    $("#violationCategory").val() == "Quarry"
      ? { QuarryCode: $("#theCode").val() }
      : { CarNumber: $("#theCode").val() };
  let request = {
    Data: {
      ...theCode,
      RowsPerPage: 10,
      PageIndex: pagination.currentPage,
      ColName: "created",
      SortOrder: "desc",
      Status: "Pending",
      ViolatorName: $("#violatorName").val(),
      NationalID: $("#nationalID").val(),
      ViolationCode: $("#violationCode").val(),
      PaymentStatus: "قيد الإنتظار",
      Sector: UserId,
      ViolationType: ViolationType,
      OffenderType: $("#violationCategory").val(),
      ViolationsZone: $("#violationZone").val(),
      CreatedFrom: $("#createdFrom").val()
        ? moment($("#createdFrom").val(), "DD-MM-YYYY").format("YYYY-MM-DD")
        : null,
      CreatedTo: $("#createdTo").val()
        ? moment($("#createdTo").val(), "DD-MM-YYYY").format("YYYY-MM-DD")
        : null,
    },
  };
  functions
    .requester("/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Search", {
      request,
    })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      // $(".violationZone").children("option:selected").prop("selected",false)
      // $(".TypeofViolation").children("option:selected").prop("selected",false)
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
      violationRecords.dashBoardTable(violationsData, destroyTable);
      violationRecords.dataObj.destroyTable = true;
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
  let taskViolation;
  // let violationData;
  if (violationsData.length > 0) {
    violationsData.forEach((record) => {
      taskViolation = record.Violation;
      // if(taskViolation.Sector == UserId){
      data.push([
        `<div class="violationId" data-violationid="${record.ViolationId}" data-taskid="${record.ID}" data-offendertype="${taskViolation.OffenderType}">${taskViolation.ViolationCode}</div>`,
        `<div class='controls'>
              <div class='ellipsisButton'>
                  <i class='fa-solid fa-ellipsis-vertical'></i>
              </div>
              <div class="hiddenListBox">
                  <div class='arrow'></div>
                  <ul class='list-unstyled controlsList'>
                      <li><a href="#" class="itemDetails"> المزيد من التفاصيل</a></li>                    
                  </ul>
              </div>
          </div`,
        `<div class="violationArName">${functions.getViolationArabicName(
          taskViolation.OffenderType
        )}</div>`,
        `<div class="violationCode">${
          taskViolation.OffenderType == "Vehicle"
            ? taskViolation.CarNumber
            : taskViolation.QuarryCode != ""
            ? taskViolation.QuarryCode
            : "---"
        }</div>`,
        `<div class="companyName">${
          taskViolation.ViolatorCompany != ""
            ? taskViolation.ViolatorCompany
            : "-"
        }</div>`,
        `<div class="violationType" data-typeid="${
          taskViolation.OffenderType == "Quarry"
            ? taskViolation.ViolationTypes.ID
            : 0
        }">${functions.getViolationArabicName(
          taskViolation.OffenderType,
          taskViolation?.ViolationTypes?.Title
        )}</div>`,
        `<div class="violationZone">${taskViolation.ViolationsZone}</div>`,
        `${functions.getFormatedDate(taskViolation.ViolationDate)}`,
      ]);
      // <li><a href="#" class="printViolationDetails"> طباعة التقرير</a></li>
      // }
    });
  }

  if (violationRecords.dataObj.destroyTable || destroyTable) {
    $("#ViolationsRecord").DataTable().destroy();
  }
  let Table = functions.tableDeclare(
    "#ViolationsRecord",
    data,
    [
      { title: "رقم المخالفة", class: "no-sort" },
      { title: "", class: "all no-sort" },
      { title: "تصنيف المخالفة", class: "no-sort" },
      { title: " رقم المحجر/العربة", class: "no-sort" },
      { title: "إسم الشركة المخالفة", class: "no-sort" },
      { title: "نوع المخالفة ", class: "no-sort" },
      { title: "المنطقة", class: "no-sort" },
      { title: "تاريخ الضبط", class: "sort" },
    ],
    false,
    false,
    "سجل المحاضر المسجلة.xlsx",
    "سجل المحاضر المسجلة"
  );
  violationRecords.dataObj.destroyTable = true;
  $(".ellipsisButton").on("click", (e) => {
    $(".hiddenListBox").hide(300);
    $(e.currentTarget).siblings(".hiddenListBox").toggle(300);
  });

  let violationlog = Table.rows().nodes().to$();
  $.each(violationlog, (index, record) => {
    let jQueryRecord = $(record);
    let violationID = jQueryRecord.find(".violationId").data("violationid");
    let taskID = jQueryRecord.find(".violationId").data("taskid");
    let OffenderType = jQueryRecord.find(".violationId").data("offendertype");

    jQueryRecord
      .find(".controls")
      .children(".hiddenListBox")
      .find(".itemDetails")
      .on("click", (e) => {
        $(".overlay").addClass("active");
        violationRecords.findViolationByID(e, taskID);
      });
    jQueryRecord
      .find(".controls")
      .children(".hiddenListBox")
      .find(".printViolationDetails")
      .on("click", (e) => {
        $(".overlay").addClass("active");
        violationRecords.findViolationByID(e, taskID, true);
      });
  });
  functions.hideTargetElement(".controls", ".hiddenListBox");
};
violationRecords.findViolationByID = (event, taskID, print = false) => {
  let request = {
    Id: taskID,
  };
  functions
    .requester(
      "/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/FindbyId",
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
        violationData = data.d.Violation;
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
        } else if (violationOffenderType == "Vehicle") {
          Content = DetailsPopup.vehicleDetailsPopupContent(
            violationData,
            "المسجلة"
          );
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          functions.declarePopup(
            ["generalPopupStyle", "detailsPopup", "blueHeaderPopup"],
            printBox
          );
          let vehicleType = violationData.VehicleType;
          $(".TrailerNumberBox").addClass("hello");
          if (vehicleType == "عربة بمقطورة") {
            $(".TrailerNumberBox").addClass("hello");
            $(".TrailerNumberBox")
              .show()
              .css("background-color", "red !important");
          } else {
            $(".TrailerNumberBox").hide();
            $(".TrailerNumberBox").addClass("hello");
          }
        } else if (violationOffenderType == "Equipment") {
          Content = DetailsPopup.equipmentDetailsPopupContent(
            violationData,
            "المسجلة"
          );
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          functions.declarePopup(
            ["generalPopupStyle", "detailsPopup", "blueHeaderPopup"],
            printBox
          );
        }
        $(".printBtn").on("click", (e) => {
          functions.PrintDetails(e);
        });
        if (print) {
          functions.PrintDetails(event);
        }
        $(".detailsPopupForm").addClass("registredViolationsLog");
        $(".registredViolationsLog")
          .find(".CommiteeMembersBox")
          .show()
          .find(".formElements")
          .css("border-bottom", "none");
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
  let OffenderTypeVal = $("#violationCategory")
    .children("option:selected")
    .val();
  let ViolationTypeVal = $("#TypeofViolation")
    .children("option:selected")
    .data("id");
  let ViolationGeneralSearch = $("#violationSearch").val();
  let ViolationType;
  let ViolationSector;

  // let ViolationType;
  // let offenderType;

  if (
    ViolationTypeVal == "" &&
    OffenderTypeVal == "" &&
    ViolationGeneralSearch == ""
  ) {
    functions.warningAlert(
      "من فضلك قم بإدخال قيمة واحدة على الأقل من قيم البحث"
    );
  } else if (
    OffenderTypeVal != "" ||
    ViolationTypeVal != "0" ||
    ViolationGeneralSearch != ""
  ) {
    $(".PreLoader").addClass("active");
    violationRecords.dataObj.OffenderType = $("#violationCategory")
      .children("option:selected")
      .val();
    violationRecords.dataObj.ViolationType = Number(
      $("#TypeofViolation").children("option:selected").data("id")
    );

    violationRecords.getViolations(
      pageIndex,
      true,
      ViolationSector,
      violationRecords.dataObj.ViolationType,
      ViolationGeneralSearch
    );
  }
};

violationRecords.resetFilter = (e) => {
  e.preventDefault();
  $("#nationalID").val("");
  $("#violatorName").val("");
  $("#violationCode").val("");
  $("#violationSector").val("0");
  $("#violationCategory").val("");
  $("#TypeofViolation").val("0");
  $("#violationZone").val("");
  $("#violationSearch").val("");
  $("#createdFrom").val("");
  $("#createdTo").val("");
  $("#theCode").val("");

  $(".PreLoader").addClass("active");
  pagination.reset();
  violationRecords.getViolations();
};

export default violationRecords;

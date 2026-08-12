import Swal from "sweetalert2";
import DetailsPopup from "../../Shared/detailsPopupContent";
import functions from "../../Shared/functions";
import { ajaxDatatableHistoryInit } from "../../Shared/ajaxDatatable";
import sharedApis from "../../Shared/sharedApiCall";
import pagination from "../../Shared/Pagination";

import { event } from "jquery";
import ViolationHistoryLogs from "../../Shared/ViolationHistoryLogs";

let confirmedViolationLog = {};

confirmedViolationLog.pageIndex = 1;
confirmedViolationLog.destroyTable = false;

confirmedViolationLog.getConfirmedLog = (
  pageIndex = 1,
  destroyTable = false,
  ViolationSector = Number($("#violationSector").children("option:selected").val()),
  ViolationType = Number($("#TypeofViolation").children("option:selected").data("id")),
  ViolationGeneralSearch = $("#violationSearch").val()
) => {
  // Check if theCode field has a value but violationCategory is empty
  const theCodeValue = $("#theCode").val();
  const trailerNumValue = $("#trailerNum").val();
  const violationCategoryValue = $("#violationCategory").val();

  if (
    (theCodeValue?.trim() || trailerNumValue?.trim()) &&
    (!violationCategoryValue || violationCategoryValue === "")
  ) {
    functions.warningAlert(
      "من فضلك قم باختيار تصنيف المخالفة قبل إدخال رقم المحجر/عربة/مقطورة"
    );

    $(".overlay").removeClass("active");
    return;
  }

  const theCode = violationCategoryValue == "Quarry"
    ? { QuarryCode: $("#theCode").val() }
    : { CarNumber: $("#theCode").val() };

  // Get selected status
  const selectedStatus = $("#ViolationStatus").children("option:selected").val();

  // Determine MultipleStatus based on selected status
  let multipleStatus = [];

  if (selectedStatus && selectedStatus !== "") {
    // If a specific status is selected, only use that status
    multipleStatus = [selectedStatus];
  } else {
    // If no status selected, use default list (excluding any you don't want)
    multipleStatus = ["Confirmed", "Paid", "Exceeded", "Paid After Reffered", "Saved", "Cancelled", "UnderReview", "UnderPayment"];
  }

  let request = {
    Data: {
      ...theCode,
      RowsPerPage: 10,
      PageIndex: pagination.currentPage,
      ColName: "created",
      SortOrder: "desc",
      Status: selectedStatus,
      MultipleStatus: multipleStatus,
      IsExternalRecord: false,
      ViolatorName: $("#violatorName").val(),
      NationalID: $("#nationalID").val(),
      ViolationCode: $("#violationCode").val(),
      TrailerNum: $("#trailerNum").val(),
      ViolationType: ViolationType,
      SectorConfigId: ViolationSector,
      GlobalSearch: ViolationGeneralSearch,
      Sector: 0,
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
  $(".overlay").addClass("active");
  functions
    .requester("_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Search", {
      request,
    })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      $(".overlay").removeClass("active");
      let ConfirmedViolation = [];
      let ItemsData = data.d.Result;
      if (data.d.Result.GridData != null) {
        if (data.d.Result.GridData.length > 0) {
          Array.from(data.d.Result.GridData).forEach((element) => {
            ConfirmedViolation.push(element);
          });
        } else {
          ConfirmedViolation = [];
        }
      }
      confirmedViolationLog.setPaginations(ItemsData.TotalPageCount, ItemsData.RowsPerPage);
      confirmedViolationLog.ConfirmedViolationTable(ConfirmedViolation, confirmedViolationLog.destroyTable);
      confirmedViolationLog.pageIndex = ItemsData.CurrentPage;
    })
    .catch((err) => {
      $(".overlay").removeClass("active");
      console.log(err);
    });
};

confirmedViolationLog.setPaginations = (TotalPages, RowsPerPage) => {
  pagination.draw("#paginationID", TotalPages, RowsPerPage);
  pagination.start("#paginationID", confirmedViolationLog.getConfirmedLog);
  pagination.activateCurrentPage();
};

confirmedViolationLog.filterConfirmedLog = (e) => {
  let pageIndex = confirmedViolationLog.pageIndex;
  let ViolationSectorVal = $("#violationSector").children("option:selected").val();
  let ViolationTypeVal = $("#TypeofViolation").children("option:selected").data("id");
  let ViolationGeneralSearch = $("#violationSearch").val();

  const theCodeValue = $("#theCode").val();
  const trailerNumValue = $("#trailerNum").val();
  const violationCategoryValue = $("#violationCategory").val();

  if (
    (theCodeValue?.trim() || trailerNumValue?.trim()) &&
    (!violationCategoryValue || violationCategoryValue === "")
  ) {
    functions.warningAlert(
      "من فضلك قم باختيار تصنيف المخالفة قبل إدخال رقم المحجر/عربة/مقطورة"
    );
    return;
  }

  let ViolationType;
  let ViolationSector;

  if (
    ViolationTypeVal == "" &&
    ViolationSectorVal == "" &&
    ViolationGeneralSearch == ""
  ) {
    functions.warningAlert(
      "من فضلك قم بإدخال قيمة واحدة على الأقل من قيم البحث"
    );
  } else if (
    ViolationSectorVal != "" ||
    ViolationTypeVal != "0" ||
    ViolationGeneralSearch != ""
  ) {
    $(".overlay").addClass("active");
    ViolationSector = Number($("#violationSector").children("option:selected").val());
    ViolationType = Number($("#TypeofViolation").children("option:selected").data("id"));

    confirmedViolationLog.getConfirmedLog(
      pageIndex,
      true,
      ViolationSector,
      ViolationType,
      ViolationGeneralSearch
    );
  }
};

confirmedViolationLog.resetFilter = (e) => {
  e.preventDefault();
  $("#nationalID").val("");
  $("#violatorName").val("");
  $("#violationCode").val("");
  $("#trailerNum").val("");
  $("#violationSector").val("0");
  $("#violationCategory").val("");
  $("#TypeofViolation").val("0");
  $("#violationZone").val("");
  $("#violationSearch").val("");
  $("#createdFrom").val("");
  $("#createdTo").val("");
  $("#theCode").val("");
  $("#ViolationStatus").val("");

  $(".overlay").addClass("active");
  pagination.reset();
  confirmedViolationLog.getConfirmedLog();
};

confirmedViolationLog.handleViolationCategoryChange = () => {
  $("#violationCategory").on("change", function () {
    const selectedCategory = $(this).val();

    const $theCodeField = $("#theCode");
    const $typeOfViolationField = $("#TypeofViolation");
    const $trailerNumField = $("#trailerNum");

    // Default: enable all
    $theCodeField.prop("disabled", false);
    $typeOfViolationField.prop("disabled", false);
    $trailerNumField.prop("disabled", false);

    if (selectedCategory === "Equipment") {
      $theCodeField.prop("disabled", true).val("");
      $typeOfViolationField.prop("disabled", true).val("0");
      $trailerNumField.prop("disabled", true).val("");
    }
    else if (selectedCategory === "Vehicle") {
      // Vehicle allows trailer number
      $typeOfViolationField.prop("disabled", true).val("0");
      $trailerNumField.prop("disabled", false);
    }
    else if (selectedCategory === "Quarry") {
      // Quarry doesn't allow trailer number
      $trailerNumField.prop("disabled", true).val("");
    }
    else {
      // No category selected
      $trailerNumField.prop("disabled", true).val("");
    }
  });
};
const originalResetFilter = confirmedViolationLog.resetFilter;
confirmedViolationLog.resetFilter = function (e) {
  // Call the original resetFilter function
  originalResetFilter.call(this, e);

  // Re-enable both fields after reset
  $("#theCode").prop("disabled", false);
  $("#TypeofViolation").prop("disabled", false);

  // No category selected after reset
  $("#trailerNum").prop("disabled", true).val("");
};


confirmedViolationLog.exportToExcel = () => {
  const theCodeValue = $("#theCode").val();
  const violationCategoryValue = $("#violationCategory").val();

  const theCode = {};
  if (theCodeValue && theCodeValue.trim() !== "" && violationCategoryValue) {
    if (violationCategoryValue === "Quarry") {
      theCode.QuarryCode = theCodeValue;
    } else if (violationCategoryValue === "Vehicle") {
      theCode.CarNumber = theCodeValue;
    }
  }

  const selectedStatus = $("#ViolationStatus").children("option:selected").val();

  let multipleStatus = [];
  if (selectedStatus && selectedStatus !== "") {
    multipleStatus = [selectedStatus];
  } else {
    multipleStatus = ["Confirmed", "Paid", "Exceeded", "Paid After Reffered", "Saved", "Cancelled", "UnderReview", "UnderPayment"];
  }

  const currentFilters = {
    ...theCode,
    RowsPerPage: 10000000,
    PageIndex: 1,
    ColName: "created",
    SortOrder: "desc",
    Status: selectedStatus,
    MultipleStatus: multipleStatus,
    ViolatorName: $("#violatorName").val(),
    NationalID: $("#nationalID").val(),
    ViolationCode: $("#violationCode").val(),
    TrailerNum: $("#trailerNum").val(),
    ViolationType: Number($("#TypeofViolation").children("option:selected").data("id")),
    SectorConfigId: Number($("#violationSector").children("option:selected").val()),
    GlobalSearch: $("#violationSearch").val(),
    Sector: 0,
    OffenderType: $("#violationCategory").val(),
    ViolationsZone: $("#violationZone").val(),
    CreatedFrom: $("#createdFrom").val() ? moment($("#createdFrom").val(), "DD-MM-YYYY").format("YYYY-MM-DD") : null,
    CreatedTo: $("#createdTo").val() ? moment($("#createdTo").val(), "DD-MM-YYYY").format("YYYY-MM-DD") : null,
  };

  const allColumns = [
    {
      title: "رقم المخالفة",
      render: (record) => record.Violation?.ViolationCode || "-",
    },
    {
      title: "",
      skip: true
    },
    {
      title: "تصنيف المخالفة",
      render: (record) =>
        functions.getViolationArabicName(record.Violation?.OffenderType),
    },
    {
      title: "نوع المخالفة",
      render: (record) =>
        functions.getViolationArabicName(
          record.Violation?.OffenderType,
          record.Violation?.ViolationTypes?.Title
        ),
    },
    {
      title: "تاريخ الإنشاء",
      render: (record) =>
        record.Created
          ? moment(record.Created).format("DD-MM-YYYY hh:mm A")
          : "-",

    },
    {
      title: "تاريخ المحضر",
      render: (record) => {
        if (!record.Violation?.ViolationDate) return "-";

        return moment(record.Violation.ViolationDate).format(
          "DD-MM-YYYY hh:mm A"
        );
      },
    },
    {
      title: "اسم المخالف",
      render: (record) =>
        record.Violation?.ViolatorName ||
        "-",
    },
    {
      title: "إسم الشركة",
      render: (record) => record.Violation?.ViolatorCompany || "-",
    },
    {
      title: "رقم المحجر / العربة",
      render: (record) => {
        const violation = record.Violation;
        if (!violation) return "-";
        return violation.OffenderType === "Vehicle" ? (violation.CarNumber || "-") : (violation.QuarryCode || "-");
      },
    },
    {
      title: "رقم المقطورة",
      render: (record) =>
        record.Violation?.TrailerNum || "-",
    },
    {
      title: "المنطقة",
      render: (record) =>
        record.Violation?.ViolationsZone || "-",
    },
    {
      title: "مبلغ المادة المحجرية",
      render: (record) => {
        return functions.getDisplayValue(record.Violation?.TotalPriceDue, true);
      },
    },
    {
      title: "قيمة الإتاوة",
      render: (record) => {
        return functions.getDisplayValue(record.Violation?.LawRoyalty, true);
      },
    },
    {
      title: "قيمة المعدة",
      render: (record) => {
        return functions.getDisplayValue(record.Violation?.TotalEquipmentsPrice, true);
      },
    },
    {
      title: "الكمية",
      render: (record) => {
        return functions.getDisplayValue(record.Violation?.TotalQuantity, true);
      }
    },
    {
      title: "حالة المخالفة",
      render: (record) => {
        const status = record.Status;

        const statusMap = {
          Pending: "قيد الانتظار",
          Confirmed: "قيد الانتظار",
          Exceeded: "تجاوز مدة السداد",
          Saved: "محفوظة",
          "Paid After Reffered": "سداد بعد الإحالة",
          Paid: "تم السداد",
          UnderPayment: "قيد السداد",
          Approved: "تم الموافقة",
          Rejected: "مرفوضة",
          Reffered: "تم الإحالة",
          UnderReview: "منظورة",
          ExternalReviewed: "منظورة",
          Completed: "مكتملة",
          Cancelled: "ملغاه",
        };

        return statusMap[status] || status || "-";
      },
    },
    {
      title: "حالة الالتماس",
      render: (record) => {
        const violation = record.Violation;

        if (!violation?.IsPetition) return "-";

        return (
          functions.getPetitionsStatus(
            violation?.Petition?.GridData?.[0]?.Status
          ) || "-"
        );
      },
    },
    {
      title: "موقف الإحالة",
      render: (record) =>
        record?.ReferralStatus || "-",
    },
    {
      title: "الإحداثيات",
      exportOnly: true,
      render: (record) => {
        const violation = record.Violation;
        if (!violation) return "-";

        // Try to get coordinates in degrees format first, fallback to regular format
        const coordinatesDegrees = violation.CoordinatesDegrees;
        const coordinates = violation.Coordinates;

        if (coordinatesDegrees) {
          // Parse the coordinates array and format them nicely
          try {
            const coordsArray = JSON.parse(coordinatesDegrees);
            if (Array.isArray(coordsArray) && coordsArray.length > 0) {
              return coordsArray.join(" | ");
            }
            return coordinatesDegrees;
          } catch (e) {
            return coordinatesDegrees;
          }
        }

        if (coordinates) {
          try {
            const coordsArray = JSON.parse(coordinates);
            if (Array.isArray(coordsArray) && coordsArray.length > 0) {
              return coordsArray.join(" | ");
            }
            return coordinates;
          } catch (e) {
            return coordinates;
          }
        }

        return "-";
      },
    },
  ]

  functions.exportFromAPI({
    searchUrl: "/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Search",
    requestData: { Data: currentFilters },
    columns: allColumns,
    fileName: "سجل المحاضر المصدق عليها.xlsx",
    sheetName: "سجل المحاضر المصدق عليها",
    columnWidths: 25,
    rtl: true,
    dataPath: "d.Result.GridData",
    exportButtonSelector: "#exportBtn",
    tableSelector: "#ConfirmedViolationlog"
  });
};

confirmedViolationLog.ConfirmedViolationTable = (
  ConfirmedViolation,
  destroyTable
) => {
  let data = [];
  let taskViolation;
  if (confirmedViolationLog.destroyTable || destroyTable) {
    $("#ConfirmedViolationlog").DataTable().destroy();
  }

  if (ConfirmedViolation.length > 0) {
    ConfirmedViolation.forEach((record) => {
      taskViolation = record.Violation;
      let createdDate = functions.getFormatedDate(record.Created);
      let caseStatus = record?.ReferralStatus || "";

      data.push([
        `<div class="violationId"
                data-taskid="${record.ID}"
                data-violationid="${record.ViolationId}"
                data-taskstatus="${record.Status}"
                data-paymentstatus="${record.PaymentStatus}"
                data-violationcode="${taskViolation?.ViolationCode}"
                data-totalprice="${taskViolation?.TotalPriceDue}"
                data-enddate="${record.ReconciliationExpiredDate}"
                data-offendertype="${taskViolation?.OffenderType}">
                ${taskViolation?.ViolationCode || "-"}
            </div>`,

        `<div class='controls'>
              <div class='ellipsisButton'>
                  <i class='fa-solid fa-ellipsis-vertical'></i>
              </div>
              <div class="hiddenListBox">
                  <div class='arrow'></div>
                  <ul class='list-unstyled controlsList'>
                      <li><a href="#" class="itemDetails">المزيد من التفاصيل</a></li>
                      <li>
                        <a href="#"
                          data-violationid="${taskViolation?.ID}"
                          data-violationcode="${taskViolation?.ViolationCode}"
                          class="violationHistory"
                          data-toggle="modal"
                          data-target="#trackHistoryModal">
                          تتبع مرحلة المخالفة
                        </a>
                      </li>
                  </ul>
              </div>
            </div>`,

        `<div class="violationArName">
              ${functions.getViolationArabicName(taskViolation?.OffenderType)}
            </div>`,

        `<div class="violationType"
                data-typeid="${taskViolation?.OffenderType == "Quarry"
          ? taskViolation?.ViolationTypes.ID
          : 0}">
                ${functions.getViolationArabicName(
            taskViolation?.OffenderType,
            taskViolation?.ViolationTypes?.Title
          )}
            </div>`,

        record.Created
          ? moment(record.Created).format("DD-MM-YYYY hh:mm A")
          : "-",

        taskViolation?.ViolationDate
          ? moment(taskViolation?.ViolationDate).format("DD-MM-YYYY hh:mm A")
          : "-",

        `<div class="ViolatorName">
            ${taskViolation?.ViolatorName || "-"}
            </div>`,

        `<div class="ViolatorCompany">
            ${taskViolation?.ViolatorCompany || "-"}
            </div>`,

        `<div class="violationCode">
              ${taskViolation?.OffenderType == "Vehicle"
          ? taskViolation?.CarNumber
          : taskViolation?.QuarryCode != undefined
            ? taskViolation?.QuarryCode
            : "-"}
            </div>`,

        `<div class="trailerNum">
              ${taskViolation?.TrailerNum || "-"}
            </div>`,

        `<div class="violationZone">
              ${taskViolation?.ViolationsZone || "-"}
            </div>`,

        `${functions.getDisplayValue(taskViolation?.TotalPriceDue, true)}`,
        `${functions.getDisplayValue(taskViolation?.LawRoyalty, true)}`,
        `${functions.getDisplayValue(taskViolation?.TotalEquipmentsPrice, true)}`,
        `${functions.getDisplayValue(taskViolation?.TotalQuantity, true)}`,

        `${confirmedViolationLog.getViolationStatus(record.Status)}`,

        `${taskViolation?.IsPetition
          ? functions.getPetitionsStatus(
            taskViolation?.Petition?.GridData?.[0]?.Status
          ) || "-"
          : "-"
        }`,

        `<div class="referralStatus">
                ${functions.getCaseStatus(caseStatus)}
            </div>`,
      ]);
    });
  }

  let Table = functions.tableDeclare(
    "#ConfirmedViolationlog",
    data,
    [
      { title: "رقم المخالفة" },
      { title: "", class: "all" },
      { title: "تصنيف المخالفة" },
      { title: "نوع المخالفة" },
      { title: "تاريخ الإنشاء" },
      { title: "تاريخ المحضر" },
      { title: "اسم المخالف" },
      { title: "اسم الشركة" },
      { title: "رقم المحجر / العربة" },
      { title: "رقم المقطورة" },
      { title: "المنطقة" },
      { title: "مبلغ المادة المحجرية" },
      { title: "قيمة الإتاوة" },
      { title: "قيمة المعدة" },
      { title: "الكمية" },
      { title: "حالة المخالفة" },
      { title: "حالة الالتماس" },
      { title: "موقف الإحالة" },
    ],
    false,
    false,
    "سجل المحاضر المصدق عليها.xlsx",
    "سجل المحاضر المصدق عليها"
  );

  // 🔹 create column selector
  functions.createColumnSelector(Table, "#columnSelector", 'green');

  confirmedViolationLog.destroyTable = true;

  // Update export button handler
  $("#exportBtn").off("click").on("click", () => {
    confirmedViolationLog.exportToExcel();
  });

  let violationlog = Table.rows().nodes().to$();

  // $(".ellipsisButton").on("click", (e) => {
  //   $(".hiddenListBox").hide(300);
  //   $(e.currentTarget).siblings(".hiddenListBox").toggle(300);
  // });

  $.each(violationlog, (index, record) => {
    let jQueryRecord = $(record);
    let taskID = jQueryRecord.find(".violationId").data("taskid");

    // Toggle menu
    jQueryRecord.find(".controls").children(".ellipsisButton").on("click", (e) => {
      e.stopPropagation();
      const currentBox = $(e.currentTarget).siblings(".hiddenListBox");
      $(".hiddenListBox").not(currentBox).stop(true, true).hide(300);
      currentBox.stop(true, true).toggle(300);
    });
    jQueryRecord
      .find(".controls")
      .children(".hiddenListBox")
      .find(".itemDetails")
      .on("click", (e) => {
        $(".overlay").addClass("active");
        confirmedViolationLog.findViolationByID(e, taskID);
      });
    jQueryRecord
      .find(".controls")
      .children(".hiddenListBox")
      .find(".printViolationDetails")
      .on("click", (e) => {
        $(".overlay").addClass("active");
        confirmedViolationLog.findViolationByID(e, taskID, true);
      });
  });
  functions.hideTargetElement(".controls", ".hiddenListBox");
};

confirmedViolationLog.getViolationStatus = (ViolationStatus) => {
  let statusHtml = ``;
  switch (ViolationStatus) {
    case "Pending":
    case "Confirmed": {
      statusHtml = `<div class="statusBox pendingStatus">
                <i class="statusIcon fa-regular fa-clock"></i>
                <span class="statusText">قيد الانتظار</span>
            </div>`;
      break;
    }
    case "Exceeded": {
      statusHtml = `<div class="statusBox warningStatus">
                <img class="statusIcon" src="/Style Library/MiningViolations/images/tringleIcon.svg" alt="warning">
                <span class="statusText">تجاوز مدة السداد</span>
            </div>`;
      break;
    }
    case "Saved": {
      statusHtml = `<div class="statusBox killedStatus">
                <i class="statusIcon fa-solid fa-ban"></i> 
                <span class="statusText">محفوظة</span>
            </div>`;
      break;
    }
    case "Paid After Reffered": {
      statusHtml = `<div class="statusBox closedStatus">
                <i class="statusIcon fa-regular fa-circle-check"></i>
                <span class="statusText">سداد بعد الإحالة</span>
            </div>`;
      break;
    }
    case "Paid": {
      statusHtml = `<div class="statusBox closedStatus">
                <i class="statusIcon fa-regular fa-circle-check"></i>
                <span class="statusText">تم السداد</span>
            </div>`;
      break;
    }
    case "UnderPayment": {
      statusHtml = `<div class="statusBox warningStatus">
                <img class="statusIcon" src="/Style Library/MiningViolations/images/tringleIcon.svg" alt="warning">
                <span class="statusText">قيد السداد</span>
            </div>`;
      break;
    }
    case "Approved": {
      statusHtml = `<div class="statusBox closedStatus">
                <i class="statusIcon fa-regular fa-circle-check"></i>
                <span class="statusText">تم الموافقة</span>
            </div>`;
      break;
    }
    case "Rejected": {
      statusHtml = `<div class="statusBox killedStatus">
                <i class="statusIcon fa-solid fa-ban"></i> 
                <span class="statusText">مرفوضة</span>
            </div>`;
      break;
    }
    case "Reffered": {
      statusHtml = `<div class="statusBox pendingStatus">
                <i class="statusIcon fa-regular fa-paper-plane"></i>
                <span class="statusText">تم الإحالة</span>
            </div>`;
      break;
    }
    case "UnderReview": {
      statusHtml = `<div class="statusBox pendingStatus">
                <i class="statusIcon fa-regular fa-eye"></i>
                <span class="statusText">منظورة</span>
            </div>`;
      break;
    }
    case "ExternalReviewed": {
      statusHtml = `<div class="statusBox pendingStatus">
                <i class="statusIcon fa-regular fa-eye"></i>
                <span class="statusText">منظورة</span>
            </div>`;
      break;
    }
    case "Completed": {
      statusHtml = `<div class="statusBox closedStatus">
                <i class="statusIcon fa-regular fa-circle-check"></i>
                <span class="statusText">مكتملة</span>
            </div>`;
      break;
    }
    case "Cancelled": {
      statusHtml = `<div class="statusBox killedStatus">
                <i class="statusIcon fa-solid fa-ban"></i> 
                <span class="statusText">ملغاه</span>
            </div>`;
      break;
    }
  }

  return statusHtml;
};

confirmedViolationLog.findViolationByID = (event, taskID, print = false) => {
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
      let violationID;

      if (data != null) {
        violationData = data.d.Violation;
        violationID = data.d.ViolationId;
        violationOffenderType = violationData.OffenderType;
        if (violationOffenderType == "Quarry") {
          Content = DetailsPopup.quarryDetailsPopupContent(
            violationData,
            "المصدق عليها"
          );
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          functions.declarePopup(
            ["generalPopupStyle", "detailsPopup"],
            printBox
          );
        } else if (violationOffenderType == "Vehicle") {
          Content = DetailsPopup.vehicleDetailsPopupContent(
            violationData,
            "المصدق عليها"
          );
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          functions.declarePopup(
            ["generalPopupStyle", "detailsPopup"],
            printBox
          );
          let VehcleType = violationData.VehicleType;
          if (VehcleType == "عربة بمقطورة") {
            $(".TrailerNumberBox").show();
          } else {
            $(".TrailerNumberBox").hide();
          }
        } else if (violationOffenderType == "Equipment") {
          Content = DetailsPopup.equipmentDetailsPopupContent(
            violationData,
            "المصدق عليها"
          );
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          functions.declarePopup(
            ["generalPopupStyle", "detailsPopup"],
            printBox
          );
        }

        // FIX: Hide buttons AFTER rendering - Add this block
        setTimeout(() => {
          const popup = $(".detailsPopupForm");
          popup.find("#editMaterialMinPrice, #payAllPrice")
            .css("display", "none")
            .attr("style", "display: none !important");
        }, 50);

        $(".popupForm").addClass("Confirmedform");
        $(".totalPriceBox").show().find(".dateLimitBox").hide();
        $(".confirmationAttachBox").show();
        $(".Confirmedform").find(".addConfirmationAttchBox").hide();
        $(".Confirmedform").find(".rejectReasonBox").hide();
        $(".Confirmedform").find(".showFormula").hide();
        if (print) {
          $(".Confirmedform").find(".confirmationAttachBox").show();
          functions.PrintDetails(event);
        }
        $(".printBtn").on("click", (e) => {
          functions.PrintDetails(e);
        });
        $(".detailsPopupForm").addClass("confirmedTasks");
        DetailsPopup.getConfirmationAttachments(taskID);
      } else {
        violationData = null;
      }
    })
    .catch((err) => {
      console.log(err);
    });
};


// ===============================
//  Violation History Tracking for External Violations
// ===============================
ViolationHistoryLogs.init(".contentContainer");


export default confirmedViolationLog;
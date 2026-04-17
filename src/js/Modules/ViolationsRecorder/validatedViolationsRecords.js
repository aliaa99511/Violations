import functions from "../../Shared/functions";
import DetailsPopup from "../../Shared/detailsPopupContent";
import pagination from "../../Shared/Pagination";

let validatedViolationsRecords = {};
validatedViolationsRecords.pageIndex = 1;
validatedViolationsRecords.destroyTable = false;

validatedViolationsRecords.getViolations = (
  pageIndex = 1,
  destroyTable = false,
  ViolationType = Number($("#TypeofViolation").children("option:selected").data("id")),
  ViolationGeneralSearch = $("#violationSearch").val()
) => {
  let UserId = _spPageContextInfo.userId;

  // Check if theCode field has a value but violationCategory is empty
  const theCodeValue = $("#theCode").val();
  const violationCategoryValue = $("#violationCategory").val();

  if (theCodeValue && theCodeValue.trim() !== "" && (!violationCategoryValue || violationCategoryValue === "")) {
    functions.warningAlert("من فضلك قم باختيار تصنيف المخالفة قبل إدخال رقم المحجر/عربة/معدة");
    $(".PreLoader").removeClass("active");
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
    multipleStatus = [
      "Confirmed",
      "Paid",
      "Exceeded",
      "Paid After Reffered",
      "Saved",
      "Cancelled"
      // "UnderPayment",
    ];
  }

  let request = {
    Data: {
      ...theCode,
      RowsPerPage: 10,
      PageIndex: pagination.currentPage,
      ColName: "created",
      SortOrder: "desc",
      Status: selectedStatus, // Keep this for reference
      MultipleStatus: multipleStatus, // Use dynamic multipleStatus
      ViolatorName: $("#violatorName").val(),
      NationalID: $("#nationalID").val(),
      ViolationCode: $("#violationCode").val(),
      ViolationType: ViolationType,
      GlobalSearch: ViolationGeneralSearch,
      Sector: UserId,
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
      $(".PreLoader").removeClass("active");
      let ValidatedViolationData = [];

      let ItemsData = data.d.Result;
      if (data.d.Result?.GridData != null) {
        if (data.d.Result.GridData?.length > 0) {
          Array.from(data.d.Result?.GridData).forEach((element) => {
            ValidatedViolationData.push(element);
          });
        } else {
          ValidatedViolationData = [];
        }
      }
      validatedViolationsRecords.setPaginations(ItemsData.TotalPageCount, ItemsData.RowsPerPage,);
      validatedViolationsRecords.dashBoardTable(ValidatedViolationData, destroyTable);
      validatedViolationsRecords.pageIndex = ItemsData.CurrentPage;
    })
    .catch((err) => {
      console.log(err);
    });
};

validatedViolationsRecords.setPaginations = (TotalPages, RowsPerPage) => {
  pagination.draw("#paginationID", TotalPages, RowsPerPage);
  pagination.start("#paginationID", validatedViolationsRecords.getViolations);
  pagination.activateCurrentPage();
};

validatedViolationsRecords.filterViolationsLog = (e) => {
  let pageIndex = validatedViolationsRecords.pageIndex;
  let ViolationTypeVal = $("#TypeofViolation").children("option:selected").data("id");
  let ViolationGeneralSearch = $("#violationSearch").val();
  let violationCategory = $("#violationCategory").val(); // Get violation category value

  // Check if theCode has value but violationCategory is empty
  const theCodeValue = $("#theCode").val();
  const violationCategoryValue = $("#violationCategory").val();

  if (theCodeValue && theCodeValue.trim() !== "" && (!violationCategoryValue || violationCategoryValue === "")) {
    functions.warningAlert("من فضلك قم باختيار تصنيف المخالفة قبل إدخال رقم المحجر/عربة/معدة");
    return;
  }

  // Check if at least one filter has a value
  if (
    ViolationTypeVal == "0" &&
    ViolationGeneralSearch == "" &&
    (!violationCategory || violationCategory === "") && // Check if violationCategory is empty
    $("#violatorName").val() == "" &&
    $("#nationalID").val() == "" &&
    $("#violationCode").val() == "" &&
    $("#violationZone").val() == "" &&
    $("#createdFrom").val() == "" &&
    $("#createdTo").val() == "" &&
    $("#theCode").val() == "" &&
    $("#ViolationStatus").val() == ""
  ) {
    functions.warningAlert(
      "من فضلك قم بإدخال قيمة واحدة على الأقل من قيم البحث"
    );
  } else {
    $(".PreLoader").addClass("active");
    let ViolationType = Number($("#TypeofViolation").children("option:selected").data("id"));

    validatedViolationsRecords.getViolations(
      pageIndex,
      true,
      ViolationType,
      ViolationGeneralSearch
    );
  }
};

validatedViolationsRecords.resetFilter = (e) => {
  e.preventDefault();
  $("#nationalID").val("");
  $("#violatorName").val("");
  $("#violationCode").val("");
  $("#violationCategory").val("");
  $("#TypeofViolation").val("0");
  $("#violationZone").val("");
  $("#violationSearch").val("");
  $("#createdFrom").val("");
  $("#createdTo").val("");
  $("#theCode").val("");
  $("#ViolationStatus").val("");

  $(".PreLoader").addClass("active");
  pagination.reset();
  validatedViolationsRecords.getViolations();
};

validatedViolationsRecords.handleViolationCategoryChange = () => {
  $("#violationCategory").on("change", function () {
    const selectedCategory = $(this).val();
    const $theCodeField = $("#theCode");
    const $typeOfViolationField = $("#TypeofViolation");

    // First, enable both fields
    $theCodeField.prop("disabled", false);
    $typeOfViolationField.prop("disabled", false);

    // Handle "Equipment" selection
    if (selectedCategory === "Equipment") {
      $theCodeField.prop("disabled", true).val(""); // Disable and clear the field
      $typeOfViolationField.prop("disabled", true).val("0"); // Disable and set to default
    }

    // Handle "Vehicle" selection
    else if (selectedCategory === "Vehicle") {
      $typeOfViolationField.prop("disabled", true).val("0"); // Disable and set to default
      // theCode field remains enabled
    }
  });
};

const originalResetFilter = validatedViolationsRecords.resetFilter;
validatedViolationsRecords.resetFilter = function (e) {
  // Call the original resetFilter function
  originalResetFilter.call(this, e);

  // Re-enable both fields after reset
  $("#theCode").prop("disabled", false);
  $("#TypeofViolation").prop("disabled", false);
};

validatedViolationsRecords.exportToExcel = () => {
  let UserId = _spPageContextInfo.userId;

  // Get current filter values
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

  // Get selected status
  const selectedStatus = $("#ViolationStatus").children("option:selected").val();

  // Determine MultipleStatus based on selected status
  let multipleStatus = [];
  if (selectedStatus && selectedStatus !== "") {
    multipleStatus = [selectedStatus];
  } else {
    multipleStatus = [
      "Confirmed",
      "Paid",
      "Exceeded",
      "Paid After Reffered",
      "Saved",
      "Cancelled"
    ];
  }

  const currentFilters = {
    ...theCode,
    RowsPerPage: 10000000, // Get all records for export
    PageIndex: 1,
    ColName: "created",
    SortOrder: "desc",
    Status: selectedStatus,
    MultipleStatus: multipleStatus,
    ViolatorName: $("#violatorName").val(),
    NationalID: $("#nationalID").val(),
    ViolationCode: $("#violationCode").val(),
    ViolationType: Number($("#TypeofViolation").children("option:selected").data("id")),
    GlobalSearch: $("#violationSearch").val(),
    Sector: UserId,
    OffenderType: $("#violationCategory").val(),
    ViolationsZone: $("#violationZone").val(),
    CreatedFrom: $("#createdFrom").val() ? moment($("#createdFrom").val(), "DD-MM-YYYY").format("YYYY-MM-DD") : null,
    CreatedTo: $("#createdTo").val() ? moment($("#createdTo").val(), "DD-MM-YYYY").format("YYYY-MM-DD") : null,
  };

  // Define columns with their data mapping
  const columns = [
    {
      title: "رقم المخالفة",
      data: "Violation.ViolationCode",
    },
    {
      title: "",
      skip: true
    },
    {
      title: "تصنيف المخالفة",
      render: (record) => functions.getViolationArabicName(record.Violation?.OffenderType),
    },
    {
      title: "رقم المحجر/العربة",
      render: (record) => {
        const violation = record.Violation;
        if (!violation) return "---";
        return violation.OffenderType === "Vehicle" ? (violation.CarNumber || "---") : (violation.QuarryCode || "---");
      },
    },
    {
      title: "إسم الشركة المخالفة",
      data: "Violation.ViolatorCompany",
    },
    {
      title: "نوع المخالفة",
      render: (record) => functions.getViolationArabicName(record.Violation?.OffenderType, record.Violation?.ViolationTypes?.Title),
    },
    {
      title: "المنطقة",
      data: "Violation.ViolationsZone",
    },
    {
      title: "حالة المخالفة",
      render: (record) => {
        const status = record.Status;
        const statusMap = {
          "Pending": "قيد الانتظار",
          "Confirmed": "قيد الانتظار",
          "Exceeded": "تجاوز مدة السداد",
          "Saved": "محفوظة",
          "Paid After Reffered": "سداد بعد الإحالة",
          "Paid": "تم السداد",
          "UnderPayment": "قيد السداد",
          "Approved": "تم الموافقة",
          "Rejected": "مرفوضة",
          "Reffered": "تم الإحالة",
          "UnderReview": "قيد انتظار السداد",
          "ExternalReviewed": "خارجية",
          "Completed": "مكتملة",
          "Cancelled": "ملغاه"
        };
        return statusMap[status] || status || "---";
      },
    },
    {
      title: "حالة الالتماس",
      render: (record) => {
        if (!record.Violation?.IsPetition) return "-";
        return functions.getPetitionsStatus(record.Violation?.Petition?.GridData?.[0]?.Status) || "-";
      },
    },
    {
      title: "الحد الأقصى للمصالحة",
      render: (record) => {
        const date = functions.getFormatedDate(record.ReconciliationExpiredDate);
        return date === "01-01-2001" ? "-" : date;
      },
    },
    {
      title: "تاريخ الإنشاء",
      render: (record) => functions.getFormatedDate(record.Created),
    },
  ];

  // Call the common export function with export button selector
  functions.exportFromAPI({
    searchUrl: "/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Search",
    requestData: { Data: currentFilters },
    columns: columns,
    fileName: "سجل المحاضر المصدق عليها.xlsx",
    sheetName: "سجل المحاضر المصدق عليها",
    columnWidths: 25,
    rtl: true,
    dataPath: "d.Result.GridData",
    exportButtonSelector: "#exportBtn",
    tableSelector: "#validatedViolationsRecords"
  });
};

validatedViolationsRecords.dashBoardTable = (violationsData, destroyTable) => {
  let data = [];
  let taskViolation;

  if (validatedViolationsRecords.destroyTable || destroyTable) {
    $("#validatedViolationsRecords").DataTable().destroy();
  }

  if (violationsData.length > 0) {
    violationsData.forEach((record) => {
      taskViolation = record.Violation;
      let createdDate = functions.getFormatedDate(record.Created);

      data.push([
        `<div class="violationId" data-taskid="${record.ID}">
              ${taskViolation.ViolationCode}
              </div>`,
        `<div class='controls'>
                <div class='ellipsisButton'>
                    <i class='fa-solid fa-ellipsis-vertical'></i>
                </div>
                <div class="hiddenListBox">
                    <div class='arrow'></div>
                    <ul class='list-unstyled controlsList'>
                        <li><a href="#" class="itemDetails">المزيد من التفاصيل</a></li>                     
                    </ul>
                </div>
            </div>`,
        `<div class="violationArName">${functions.getViolationArabicName(
          taskViolation.OffenderType
        )}</div>`,
        `<div class="violationCode">${taskViolation.OffenderType == "Vehicle"
          ? taskViolation.CarNumber
          : taskViolation.QuarryCode != ""
            ? taskViolation.QuarryCode
            : "---"
        }</div>`,
        `<div class="companyName">${taskViolation.ViolatorCompany != ""
          ? taskViolation.ViolatorCompany
          : "-"
        }</div>`,
        `<div class="violationType" data-typeid="${taskViolation.OffenderType == "Quarry"
          ? taskViolation.ViolationTypes.ID
          : 0
        }">${functions.getViolationArabicName(
          taskViolation.OffenderType,
          taskViolation?.ViolationTypes?.Title
        )}</div>`,
        `<div class="violationZone">${taskViolation.ViolationsZone}</div>`,
        `${validatedViolationsRecords.getViolationStatus(record.Status)}`,
        `${taskViolation?.IsPetition
          ? functions.getPetitionsStatus(
            taskViolation?.Petition?.GridData?.[0]?.Status
          ) || "-"
          : "-"
        }`,
        `${functions.getFormatedDate(record.ReconciliationExpiredDate) ==
          "01-01-2001"
          ? "-"
          : functions.getFormatedDate(record.ReconciliationExpiredDate)
        }`,
        `${createdDate}`,
      ]);
    });
  }

  let Table = functions.tableDeclare(
    "#validatedViolationsRecords",
    data,
    [
      { title: "رقم المخالفة" },
      { title: "", class: "all" },
      { title: "تصنيف المخالفة" },
      { title: "رقم المحجر/العربة" },
      { title: "إسم الشركة المخالفة" },
      { title: "نوع المخالفة " },
      { title: "المنطقة", visible: true },
      { title: "حالة المخالفة" },
      { title: "حالة الالتماس" },
      { title: "الحد الأقصى للمصالحة" },
      { title: "تاريخ الإنشاء" },
    ],
    false,
    false,
    "سجل المحاضر المصدق عليها.xlsx",
    "سجل المحاضر المصدق عليها"
  );

  // 🔹 create column selector
  functions.createColumnSelector(Table, "#columnSelector", 'blue');

  validatedViolationsRecords.destroyTable = true;

  // Update export button handler
  $("#exportBtn").off("click").on("click", () => {
    validatedViolationsRecords.exportToExcel();
  });

  $(".ellipsisButton").on("click", (e) => {
    $(".hiddenListBox").hide(300);
    $(e.currentTarget).siblings(".hiddenListBox").toggle(300);
  });

  let violationlog = Table.rows().nodes().to$();
  $.each(violationlog, (index, record) => {
    let jQueryRecord = $(record);
    let taskID = jQueryRecord.find(".violationId").data("taskid");

    jQueryRecord
      .find(".controls")
      .children(".hiddenListBox")
      .find(".itemDetails")
      .on("click", (e) => {
        $(".overlay").addClass("active");
        validatedViolationsRecords.findViolationByID(e, taskID);
      });
    jQueryRecord
      .find(".controls")
      .children(".hiddenListBox")
      .find(".printViolationDetails")
      .on("click", (e) => {
        $(".overlay").addClass("active");
        validatedViolationsRecords.findViolationByID(e, taskID, true);
      });
  });
  functions.hideTargetElement(".controls", ".hiddenListBox");
};

validatedViolationsRecords.getViolationStatus = (ViolationStatus) => {
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
                <span class="statusText">قيد انتظار السداد</span>
            </div>`;
      break;
    }
    case "ExternalReviewed": {
      statusHtml = `<div class="statusBox pendingStatus">
                <i class="statusIcon fa-regular fa-external-link"></i>
                <span class="statusText">خارجية</span>
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
    default: {
      statusHtml = `<div class="statusBox pendingStatus">
                <i class="statusIcon fa-regular fa-question-circle"></i>
                <span class="statusText">${ViolationStatus || "---"}</span>
            </div>`;
      break;
    }
  }

  return statusHtml;
};

validatedViolationsRecords.findViolationByID = (
  event,
  taskID,
  print = false
) => {
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
      let TaskData;
      let TaskId;
      let ExDate;

      if (data != null) {
        TaskData = data.d;
        violationData = TaskData.Violation;
        TaskId = TaskData.ID;
        ExDate = functions.getFormatedDate(
          TaskData.ReconciliationExpiredDate
        );

        violationOffenderType = violationData.OffenderType;

        if (violationOffenderType == "Quarry") {
          Content = DetailsPopup.quarryDetailsPopupContent(
            violationData,
            "المصدق عليها"
          );
        } else if (violationOffenderType == "Vehicle") {
          Content = DetailsPopup.vehicleDetailsPopupContent(
            violationData,
            "المصدق عليها"
          );
        } else if (violationOffenderType == "Equipment") {
          Content = DetailsPopup.equipmentDetailsPopupContent(
            violationData,
            "المصدق عليها"
          );
        }

        printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;

        // ✅ Render popup
        functions.declarePopup(
          ["generalPopupStyle", "detailsPopup", "blueHeaderPopup"],
          printBox
        );

        // ✅ FIX: Hide buttons AFTER rendering
        setTimeout(() => {
          const popup = $(".detailsPopupForm");

          popup.find("#editMaterialMinPrice, #payAllPrice")
            .css("display", "none")
            .attr("style", "display: none !important");
        }, 50);

        // Vehicle extra logic
        if (violationOffenderType == "Vehicle") {
          let vehicleType = violationData.VehicleType;
          if (vehicleType == "عربة بمقطورة") {
            $(".TrailerNumberBox").show();
          } else {
            $(".TrailerNumberBox").hide();
          }
        }

        $(".printBtn").on("click", (e) => {
          functions.PrintDetails(e);
        });

        if (print) {
          functions.PrintDetails(event);
        }

        $(".detailsPopupForm").addClass("validatedViolationsRecordsLog");
        $(".validatedViolationsRecordsLog")
          .find(".totalPriceBox")
          .show();

        $(".totalPriceBox")
          .find(".violationEndTime")
          .val(ExDate);

        $(".confirmationAttachBox").show();

        DetailsPopup.getConfirmationAttachments(TaskId);
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

export default validatedViolationsRecords;
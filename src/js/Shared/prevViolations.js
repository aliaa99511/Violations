import functions from "./functions";
import DetailsPopup from "./detailsPopupContent";
import pagination from "./Pagination";

let prevViolations = {};

prevViolations.dataObj = {
  destroyTable: false,
  ViolatorName: "",
  NationalID: "",
  CarNumber: "",
  ViolatorCompany: "",
  CommercialRegister: "",
  QuarryCode: "",
  ViolationCode: "",
  CreatedFrom: "",
  CreatedTo: "",
  ViolationSector: 0,
  ViolationType: 0,
  ViolationGeneralSearch: "",
  ViolationCategory: "",
  ViolationZone: "",
  ViolationStatus: "",
};

prevViolations.pageIndex = 1;

prevViolations.getViolations = (
  pageIndex = 1,
  destroyTable = false,
  ViolationSector = Number($("#violationSector").children("option:selected").val()),
  ViolationType = Number($("#TypeofViolation").children("option:selected").data("id")),
  ViolationGeneralSearch = $("#violationSearch").val()
) => {

  const theCodeValue = $("#theCode").val();
  const violationCategoryValue = $("#violationCategory").val();

  if (
    theCodeValue &&
    theCodeValue.trim() !== "" &&
    (!violationCategoryValue || violationCategoryValue === "")
  ) {
    functions.warningAlert(
      "من فضلك قم باختيار تصنيف المخالفة قبل إدخال رقم المحجر/عربة/معدة"
    );
    $(".PreLoader").removeClass("active");
    return;
  }

  const theCode =
    violationCategoryValue == "Quarry"
      ? { QuarryCode: $("#theCode").val() }
      : { CarNumber: $("#theCode").val() };

  const selectedStatus = $("#ViolationStatus")
    .children("option:selected")
    .val();

  let request = {
    Data: {
      ...theCode,
      RowsPerPage: 10,
      PageIndex: pagination.currentPage,
      ColName: "created",
      SortOrder: "desc",
      Status: selectedStatus,
      ViolatorName: $("#violatorName").val(),
      NationalID: $("#nationalID").val(),
      ViolationCode: $("#violationCode").val(),
      ViolationType: ViolationType,
      SectorConfigId: ViolationSector,
      GlobalSearch: ViolationGeneralSearch,
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
    .requester(
      "/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Search",
      { request }
    )
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      $(".PreLoader").removeClass("active");

      let violationsData = [];
      let ItemsData = data.d.Result;

      if (data.d.Result?.GridData != null) {
        if (data.d.Result.GridData?.length > 0) {
          Array.from(data.d.Result.GridData).forEach((element) => {
            violationsData.push(element);
          });
        }
      }

      $(".prevVioltionsCountBox")
        .find(".prevViolationCount")
        .text(ItemsData.TotalRowCount);

      prevViolations.setPaginations(
        ItemsData.TotalPageCount,
        ItemsData.RowsPerPage
      );

      prevViolations.dashBoardTable(violationsData, destroyTable);

      prevViolations.pageIndex = ItemsData.CurrentPage;
      prevViolations.dataObj.destroyTable = true;
    })
    .catch((err) => {
      console.log(err);
    });
};

prevViolations.setPaginations = (TotalPages, RowsPerPage) => {
  pagination.draw("#paginationID", TotalPages, RowsPerPage);
  pagination.start("#paginationID", prevViolations.getViolations);
  pagination.activateCurrentPage();
};

prevViolations.getViolationStatus = (ViolationStatus) => {
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
prevViolations.exportToExcel = () => {

  const theCodeValue = $("#theCode").val();
  const violationCategoryValue = $("#violationCategory").val();

  const theCode = {};

  if (
    theCodeValue &&
    theCodeValue.trim() !== "" &&
    violationCategoryValue
  ) {
    if (violationCategoryValue === "Quarry") {
      theCode.QuarryCode = theCodeValue;
    } else if (violationCategoryValue === "Vehicle") {
      theCode.CarNumber = theCodeValue;
    }
  }

  const selectedStatus = $("#ViolationStatus")
    .children("option:selected")
    .val();

  const currentFilters = {
    ...theCode,
    RowsPerPage: 10000000,
    PageIndex: 1,
    ColName: "created",
    SortOrder: "desc",
    Status: selectedStatus,
    ViolatorName: $("#violatorName").val(),
    NationalID: $("#nationalID").val(),
    ViolationCode: $("#violationCode").val(),
    ViolationType: Number(
      $("#TypeofViolation").children("option:selected").data("id")
    ),
    SectorConfigId: Number(
      $("#violationSector").children("option:selected").val()
    ),
    GlobalSearch: $("#violationSearch").val(),
    OffenderType: $("#violationCategory").val(),
    ViolationsZone: $("#violationZone").val(),
    CreatedFrom: $("#createdFrom").val()
      ? moment($("#createdFrom").val(), "DD-MM-YYYY").format("YYYY-MM-DD")
      : null,
    CreatedTo: $("#createdTo").val()
      ? moment($("#createdTo").val(), "DD-MM-YYYY").format("YYYY-MM-DD")
      : null,
  };

  const allColumns = [
    {
      title: "رقم المخالفة",
      render: (record) => record.Violation?.ViolationCode || "----",
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
      render: (record) =>
        record.Violation?.ViolationDate
          ? moment(record.Violation.ViolationDate).format(
            "DD-MM-YYYY hh:mm A"
          )
          : "-",
    },
    {
      title: "اسم المخالف",
      render: (record) => record.Violation?.ViolatorName || "-",
    },
    {
      title: "إسم الشركة",
      render: (record) => record.Violation?.ViolatorCompany || "-",
    },
    {
      title: "رقم المحجر / العربة",
      render: (record) => {
        const violation = record.Violation;
        if (!violation) return "---";

        return violation.OffenderType === "Vehicle"
          ? violation.CarNumber || "---"
          : violation.QuarryCode || "---";
      },
    },
    {
      title: "رقم المقطورة",
      render: (record) => record.Violation?.TrailerNum || "-",
    },
    {
      title: "المنطقة",
      render: (record) => record.Violation?.ViolationsZone || "----",
    },
    {
      title: "قيمة المخالفة",
      render: (record) =>
        record.Violation?.TotalPriceDue > 0
          ? record.Violation?.TotalPriceDue
          : "-",
    },
    {
      title: "قيمة الإتاوة",
      render: (record) =>
        record.Violation?.LawRoyalty > 0
          ? record.Violation?.LawRoyalty
          : "-",
    },
    {
      title: "قيمة المعدة",
      render: (record) =>
        record.Violation?.TotalEquipmentsPrice > 0
          ? record.Violation?.TotalEquipmentsPrice
          : "-",
    },
    {
      title: "حالة المخالفة",
      render: (record) => {
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

        return statusMap[record.Status] || record.Status || "-";
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
      render: (record) => record?.ReferralStatus || "----",
    },
  ];

  functions.exportFromAPI({
    searchUrl: "/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Search",
    requestData: { Data: currentFilters },
    columns: allColumns,
    fileName: "سجل المخالفات السابقة.xlsx",
    sheetName: "سجل المخالفات السابقة",
    columnWidths: 25,
    rtl: true,
    dataPath: "d.Result.GridData",
    exportButtonSelector: "#exportBtn",
    tableSelector: "#prevViolationsQueryTable",
  });
};
prevViolations.dashBoardTable = (
  violationsData = [],
  destroyTable = false
) => {

  let data = [];

  if (violationsData.length > 0) {

    violationsData.forEach((record) => {

      let taskViolation = record.Violation;
      let caseStatus = record?.ReferralStatus || "";

      data.push([

        `<div class="violationId"
            data-violationid="${record.ViolationId}"
            data-taskid="${record.ID}"
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
                    <li>
                      <a href="#" class="itemDetails">
                        المزيد من التفاصيل
                      </a>
                    </li>

                    <li>
                      <a href="#" class="printPaymentForm">
                        طباعة نموذج التصديق
                      </a>
                    </li>

                    <li>
                      <a href="#" class="printPaymentFormOnly">
                        طباعة نموذج السداد
                      </a>
                    </li>
                </ul>
            </div>
        </div>`,

        `<div class="violationArName">
          ${functions.getViolationArabicName(taskViolation?.OffenderType)}
        </div>`,

        `<div class="violationType">
          ${functions.getViolationArabicName(
          taskViolation?.OffenderType,
          taskViolation?.ViolationTypes?.Title
        )}
        </div>`,

        record.Created
          ? moment(record.Created).format("DD-MM-YYYY hh:mm A")
          : "-",

        taskViolation?.ViolationDate
          ? moment(taskViolation?.ViolationDate).format(
            "DD-MM-YYYY hh:mm A"
          )
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
          : taskViolation?.QuarryCode || "-"
        }
        </div>`,

        `<div class="trailerNum">
          ${taskViolation?.TrailerNum || "-"}
        </div>`,

        `<div class="violationZone">
          ${taskViolation?.ViolationsZone || "-"}
        </div>`,

        `${taskViolation?.TotalPriceDue > 0
          ? taskViolation?.TotalPriceDue
          : "-"
        }`,

        `${taskViolation?.LawRoyalty > 0
          ? taskViolation?.LawRoyalty
          : "-"
        }`,

        `${taskViolation?.TotalEquipmentsPrice > 0
          ? taskViolation?.TotalEquipmentsPrice
          : "-"
        }`,

        `${prevViolations.getViolationStatus(record.Status)}`,

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

  if ($.fn.DataTable.isDataTable("#prevViolationsQueryTable")) {
    $("#prevViolationsQueryTable")
      .DataTable()
      .clear()
      .destroy();

    $("#prevViolationsQueryTable").empty();
  }

  let Table = functions.tableDeclare(
    "#prevViolationsQueryTable",
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
      { title: "قيمة المخالفة" },
      { title: "قيمة الإتاوة" },
      { title: "قيمة المعدة" },
      { title: "حالة المخالفة" },
      { title: "حالة الالتماس" },
      { title: "موقف الإحالة" },
    ],
    false,
    false,
    "سجل المخالفات السابقة.xlsx",
    "سجل المخالفات السابقة"
  );

  const siteName = functions.getSiteName();
  let theme = 'blue';

  if (siteName === 'ViolationsBranch') {
    theme = 'green';
  } else if (siteName === 'ViolationsRecorder') {
    theme = 'blue';
  }

  functions.createColumnSelector(Table, "#columnSelector", theme);

  $(".ellipsisButton").on("click", (e) => {
    $(".hiddenListBox").hide(300);
    $(e.currentTarget).siblings(".hiddenListBox").toggle(300);
  });

  $("#exportBtn").off("click").on("click", () => {
    prevViolations.exportToExcel();
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

        prevViolations.findViolationByID(e, taskID);
      });

    jQueryRecord
      .find(".controls")
      .children(".hiddenListBox")
      .find(".printPaymentForm")
      .off("click")
      .on("click", (e) => {

        $(".overlay").addClass("active");

        prevViolations.printPaymentForm(e, taskID);
      });

    jQueryRecord
      .find(".controls")
      .children(".hiddenListBox")
      .find(".printPaymentFormOnly")
      .off("click")
      .on("click", (e) => {

        $(".overlay").addClass("active");

        prevViolations.printPaymentFormOnly(e, taskID);
      });
  });

  functions.hideTargetElement(".controls", ".hiddenListBox");
};
prevViolations.findViolationByID = (event, taskID, print = false) => {
  let request = {
    Id: taskID,
  };
  functions.requester(
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
          Content = DetailsPopup.quarryDetailsPopupContent(violationData, "المسجلة");
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
        } else if (violationOffenderType == "Vehicle") {
          Content = DetailsPopup.vehicleDetailsPopupContent(violationData, "المسجلة");
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          let vehicleType = violationData.VehicleType;
          if (vehicleType == "مقطورة") {
            $(".TrailerNumberBox").show();
          } else {
            $(".TrailerNumberBox").hide();
          }
        } else if (violationOffenderType == "Equipment") {
          Content = DetailsPopup.equipmentDetailsPopupContent(violationData, "المسجلة");
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
        }
        functions.declarePopup(["generalPopupStyle", "detailsPopup", functions.getSiteName() == "ViolationsRecorder" ? "blueHeaderPopup" : ""], printBox);
        $(".printBtn").on("click", (e) => {
          functions.PrintDetails(e)
        })
        if (print) {
          functions.PrintDetails(event)
        }

        // FIX: Hide buttons AFTER rendering
        setTimeout(() => {
          const popup = $(".detailsPopupForm");
          popup.find("#editMaterialMinPrice, #payAllPrice")
            .css("display", "none")
            .attr("style", "display: none !important");
        }, 50);

        $(".detailsPopupForm").addClass("registredViolationsLog")
        $(".detailsPopupForm").find(".CommiteeMembersBox").show().find(".formElements").css("border-bottom", "none")
      } else {
        violationData = null;
      }
    })
    .catch((err) => {
      console.log(err);
    });
};
prevViolations.printPaymentForm = (event, taskID, print = false) => {
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
      let TaskData;
      let violationData;
      let violationOffenderType;
      let Content;
      let printBox;

      if (data != null) {
        TaskData = data.d;
        violationData = TaskData.Violation;
        violationOffenderType = violationData.OffenderType;

        if (violationOffenderType == "Quarry") {
          $(".overlay").removeClass("active");
          Content = DetailsPopup.printPaymentForm(TaskData);
          functions.declarePopup(["generalPopupStyle", "paymentFormDetailsPopup"], Content);
        } else if (violationOffenderType == "Vehicle") {
          $(".overlay").removeClass("active");
          Content = DetailsPopup.printPaymentForm(TaskData);
          functions.declarePopup(["generalPopupStyle", "paymentFormDetailsPopup"], Content);
        } else if (violationOffenderType == "Equipment") {
          $(".overlay").removeClass("active");
          Content = DetailsPopup.printPaymentForm(TaskData);
          functions.declarePopup(["generalPopupStyle", "paymentFormDetailsPopup"], Content);
        }

        // Remove previous handlers before adding new ones
        $(".printBtn").off("click").on("click", (e) => {
          functions.PrintDetails(e);
        });

        // Remove previous handler before adding new one
        $(".printConfirmationForm").off("click").on("click", (e) => {
          functions.PrintDetails(e);
        });

      }
    })
    .catch((err) => {
      console.log(err);
    });
};
prevViolations.printPaymentFormOnly = (event, taskID) => {
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
      let TaskData;
      let Content;

      if (data != null) {
        TaskData = data.d;

        $(".overlay").removeClass("active");
        Content = DetailsPopup.printConfirmationFormOnly(TaskData);
        functions.declarePopup(["generalPopupStyle", "paymentFormDetailsPopup"], Content);

        // Add print and close button handlers
        setTimeout(() => {
          // Remove previous handlers before adding new ones
          $(".printPaymentFormBtn").off("click").on("click", (e) => {
            const lowerSection = $(".violationDetailsBody").closest(".popupSectionWrapper");
            if (lowerSection.length) {
              lowerSection.hide();
            }
            functions.PrintDetails(e);
            setTimeout(() => {
              if (lowerSection.length) {
                lowerSection.show();
              }
            }, 1000);
          });

          $(".closePrintPaymentDetailsPopup").off("click").on("click", () => {
            functions.closePopup();
          });
        }, 100);
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

prevViolations.filterViolationsLog = () => {
  let pageIndex = prevViolations.pageIndex;

  let ViolationSectorVal = $("#violationSector")
    .children("option:selected")
    .val();

  let ViolationTypeVal = $("#TypeofViolation")
    .children("option:selected")
    .data("id");

  let ViolationGeneralSearch = $("#violationSearch").val();

  const theCodeValue = $("#theCode").val();
  const violationCategoryValue = $("#violationCategory").val();

  if (
    theCodeValue &&
    theCodeValue.trim() !== "" &&
    (!violationCategoryValue || violationCategoryValue === "")
  ) {
    functions.warningAlert(
      "من فضلك قم باختيار تصنيف المخالفة قبل إدخال رقم المحجر/عربة/معدة"
    );
    return;
  }

  if (
    ViolationTypeVal == "" &&
    ViolationSectorVal == "" &&
    ViolationGeneralSearch == "" &&
    $("#violatorName").val() == "" &&
    $("#nationalID").val() == "" &&
    $("#violationCode").val() == "" &&
    $("#theCode").val() == "" &&
    $("#createdFrom").val() == "" &&
    $("#createdTo").val() == ""
  ) {
    functions.warningAlert(
      "من فضلك قم بإدخال قيمة واحدة على الأقل من قيم البحث"
    );
    return;
  }

  $(".PreLoader").addClass("active");

  prevViolations.getViolations(
    pageIndex,
    true,
    Number(ViolationSectorVal),
    Number(ViolationTypeVal),
    ViolationGeneralSearch
  );
};

prevViolations.resetFilter = (e) => {
  if (e) e.preventDefault();

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
  $("#ViolationStatus").val("");

  $("#theCode").prop("disabled", false);
  $("#TypeofViolation").prop("disabled", false);

  pagination.reset();

  $(".PreLoader").addClass("active");

  prevViolations.getViolations();
};

prevViolations.handleViolationCategoryChange = () => {
  $("#violationCategory").on("change", function () {
    const selectedCategory = $(this).val();

    const $theCodeField = $("#theCode");
    const $typeOfViolationField = $("#TypeofViolation");

    $theCodeField.prop("disabled", false);
    $typeOfViolationField.prop("disabled", false);

    if (selectedCategory === "Equipment") {
      $theCodeField.prop("disabled", true).val("");
      $typeOfViolationField.prop("disabled", true).val("0");
    } else if (selectedCategory === "Vehicle") {
      $typeOfViolationField.prop("disabled", true).val("0");
    }
  });
};

export default prevViolations;
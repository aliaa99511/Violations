import functions from "../../Shared/functions";
import DetailsPopup from "../../Shared/detailsPopupContent";
import pagination from "../../Shared/Pagination";

let runningViolations = {};
runningViolations.pageIndex = 1;
runningViolations.destroyTable = false;

runningViolations.getRunningViolations = (
  pageIndex = 1,
  destroyTable = false,
  ViolationSector = Number($("#violationSector").children("option:selected").val()),
  ViolationType = Number($("#TypeofViolation").children("option:selected").data("id")),
  ViolationGeneralSearch = ""
) => {
  let request = {
    Data: {
      RowsPerPage: 10,
      PageIndex: pagination.currentPage,
      ColName: "created",
      SortOrder: "desc",
      Status: "Approved",
      PaymentStatus: "",
      ViolationType: ViolationType,
      SectorConfigId: ViolationSector,
      GlobalSearch: $("#violationSearch").val(),
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
      let RunningViolation = [];
      let ItemsData = data?.d?.Result;
      if (data?.d?.Result?.GridData != null) {
        if (data?.d?.Result?.GridData.length > 0) {
          Array.from(data.d.Result.GridData).forEach((element) => {
            RunningViolation.push(element);
          });
        } else {
          RunningViolation = [];
        }
      }
      runningViolations.setPaginations(ItemsData.TotalPageCount, ItemsData.RowsPerPage);
      runningViolations.RunningViolationTable(RunningViolation, destroyTable);
      runningViolations.pageIndex = ItemsData.CurrentPage;
    })
    .catch((err) => {
      console.log(err);
    });
};

runningViolations.setPaginations = (TotalPages, RowsPerPage) => {
  pagination.draw("#paginationID", TotalPages, RowsPerPage);
  pagination.start("#paginationID", runningViolations.getRunningViolations);
  pagination.activateCurrentPage();
};

runningViolations.filterViolationsLog = (e) => {
  let pageIndex = runningViolations.pageIndex;
  let ViolationSectorVal = $("#violationSector").children("option:selected").val();
  let ViolationTypeVal = $("#TypeofViolation").children("option:selected").data("id");
  let ViolationGeneralSearch = $("#violationSearch").val();

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
    $(".PreLoader").addClass("active");
    ViolationSector = Number($("#violationSector").children("option:selected").val());
    ViolationType = Number($("#TypeofViolation").children("option:selected").data("id"));
    runningViolations.getRunningViolations(
      pageIndex,
      true,
      ViolationSector,
      ViolationType,
      ViolationGeneralSearch
    );
  }
};

runningViolations.resetFilter = (e) => {
  e.preventDefault();
  $("#violationSector").val("0");
  $("#violationCategory").val("");
  $("#TypeofViolation").val("0");
  $("#violationZone").val("");
  $("#violationSearch").val("");
  $("#createdFrom").val("");
  $("#createdTo").val("");

  $(".PreLoader").addClass("active");
  pagination.reset();
  runningViolations.getRunningViolations();
};

runningViolations.handleViolationCategoryChange = () => {
  $("#violationCategory").on("change", function () {
    const selectedCategory = $(this).val();
    const $typeOfViolationField = $("#TypeofViolation");

    // First, enable both fields
    $typeOfViolationField.prop("disabled", false);

    // Handle "Equipment" selection
    if (selectedCategory === "Equipment") {
      $typeOfViolationField.prop("disabled", true).val("0"); // Disable and set to default
    }

    // Handle "Vehicle" selection
    else if (selectedCategory === "Vehicle") {
      $typeOfViolationField.prop("disabled", true).val("0"); // Disable and set to default
    }
  });
};

const originalResetFilter = runningViolations.resetFilter;
runningViolations.resetFilter = function (e) {
  // Call the original resetFilter function
  originalResetFilter.call(this, e);

  // Re-enable both fields after reset
  $("#TypeofViolation").prop("disabled", false);
};

runningViolations.exportToExcel = () => {
  // Get current filter values
  const currentFilters = {
    RowsPerPage: 10000000, // Get all records for export
    PageIndex: 1,
    ColName: "created",
    SortOrder: "desc",
    Status: "Approved",
    PaymentStatus: "",
    ViolationType: Number($("#TypeofViolation").children("option:selected").data("id")),
    SectorConfigId: Number($("#violationSector").children("option:selected").val()),
    GlobalSearch: $("#violationSearch").val(),
    Sector: 0,
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
      title: "تاريخ الضبط",
      render: (record) => functions.getFormatedDate(record.Violation?.ViolationDate),
    },
    {
      title: "تاريخ الإنشاء",
      render: (record) => functions.getFormatedDate(record.Created),
    },
  ];

  functions.exportFromAPI({
    searchUrl: "/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Search",
    requestData: { Data: currentFilters },
    columns: columns,
    fileName: "المخالفات القائمة.xlsx",
    sheetName: "المخالفات القائمة",
    columnWidths: 25,
    rtl: true,
    dataPath: "d.Result.GridData",
    exportButtonSelector: "#exportBtn",
    tableSelector: "#RunningViolations"
  });
};

runningViolations.RunningViolationTable = (RunningViolation, destroyTable) => {
  let data = [];
  let taskViolation;
  if (RunningViolation.length > 0) {
    RunningViolation.forEach((record) => {
      taskViolation = record.Violation;
      if (taskViolation != null) {
        let createdDate = functions.getFormatedDate(record.Created);
        data.push([
          `<div class="violationId" data-taskid="${record.ID}" data-violationid="${record.ViolationId}" data-offendertype="${taskViolation.OffenderType}">${taskViolation.ViolationCode}</div>`,
          `<div class='controls'>
              <div class='ellipsisButton'>
                  <i class='fa-solid fa-ellipsis-vertical'></i>
              </div>
              <div class="hiddenListBox">
                  <div class='arrow'></div>
                  <ul class='list-unstyled controlsList'>
                      <li><a href="#" class="itemDetails"> المزيد من التفاصيل</a></li>
                      <li><a href="#" class="printPaymentForm"> نموذج التقييم </a></li>
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
          `${functions.getFormatedDate(taskViolation.ViolationDate)}`,
          `${createdDate}`,
        ]);
      }
    });
  }
  if (runningViolations.destroyTable || destroyTable) {
    $("#RunningViolations").DataTable().destroy();
  }
  let Table = functions.tableDeclare(
    "#RunningViolations",
    data,
    [
      { title: "رقم المخالفة" },
      { title: "", class: "all" },
      { title: "تصنيف المخالفة" },
      { title: "رقم المحجر/العربة" },
      { title: "إسم الشركة المخالفة" },
      { title: "نوع المخالفة " },
      { title: "المنطقة" },
      { title: "تاريخ الضبط" },
      { title: "تاريخ الإنشاء" },
    ],
    false,
    false,
    "المخالفات القائمة.xlsx",
    "المخالفات القائمة"
  );

  // 🔹 create column selector
  functions.createColumnSelector(Table, "#columnSelector", 'green');

  runningViolations.destroyTable = true;

  // Update export button handler
  $("#exportBtn").off("click").on("click", () => {
    runningViolations.exportToExcel();
  });

  $(".ellipsisButton").on("click", (e) => {
    $(".hiddenListBox").hide(300);
    $(e.currentTarget).siblings(".hiddenListBox").toggle(300);
  });

  let violationlog = Table.rows().nodes().to$();

  $.each(violationlog, (index, record) => {
    let jQueryRecord = $(record);
    let violationTaskID = jQueryRecord.find(".violationId").data("taskid");
    let OffenderType = jQueryRecord.find(".violationId").data("offendertype");
    let hiddenListBox = jQueryRecord
      .find(".controls")
      .children(".hiddenListBox");
    if (
      violationlog.length > 4 &&
      hiddenListBox.height() > 110 &&
      jQueryRecord.is(":nth-last-child(-n + 4)")
    ) {
      hiddenListBox.addClass("toTopDDL");
    }
    jQueryRecord
      .find(".controls")
      .children(".ellipsisButton")
      .on("click", (e) => {
        $(".hiddenListBox").hide(300);
        $(e.currentTarget).siblings(".hiddenListBox").toggle(300);
      });
    jQueryRecord
      .find(".controls")
      .children(".hiddenListBox")
      .find(".itemDetails")
      .on("click", (e) => {
        $(".overlay").addClass("active");
        runningViolations.findViolationByID(e, violationTaskID, "Details");
      });

    jQueryRecord
      .find(".controls")
      .children(".hiddenListBox")
      .find(".printPaymentForm")
      .on("click", (e) => {
        $(".overlay").addClass("active");
        runningViolations.findViolationByID(
          e,
          violationTaskID,
          "PaymentFormPrint"
        );
      });
    jQueryRecord
      .find(".controls")
      .children(".hiddenListBox")
      .find(".printViolationDetails")
      .on("click", (e) => {
        $(".overlay").addClass("active");
        runningViolations.findViolationByID(e, violationTaskID, true);
      });
  });

  functions.hideTargetElement(".controls", ".hiddenListBox");
};

runningViolations.findViolationByID = (
  event,
  violationTaskID,
  popupType = "",
  print = false
) => {
  let request = {
    Id: violationTaskID,
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
      let TaskData;
      let printBox;
      if (data != null) {
        TaskData = data.d;
        violationData = data.d.Violation;
        violationOffenderType = violationData.OffenderType;

        const showPopup = (content, popupStyles) => {
          functions.declarePopup(popupStyles, content);
          $(".printBtn").on("click", (e) => functions.PrintDetails(e));
          $(".printPaymentFormBtn").text("طباعة نموذج التقييم");
          $(".printConfirmationForm").hide();
          $(".printPaymentFormBtn").on("click", (e) =>
            functions.PrintDetails(e)
          );
          if (print) functions.PrintDetails(event);
        };
        const handlePaymentFormPrint = () => {
          $(".overlay").removeClass("active");
          const Content = DetailsPopup.printPaymentForm(TaskData);
          showPopup(Content, ["generalPopupStyle", "paymentFormDetailsPopup"]);
        };

        const handleDetailsPopup = (content) => {
          const printBox = `<div class="printBox" id="printJS-form">${content}</div>`;
          showPopup(printBox, ["generalPopupStyle", "detailsPopup"]);
        };
        if (violationOffenderType == "Quarry") {
          if (popupType == "PaymentFormPrint") {
            handlePaymentFormPrint();
          } else {
            Content = DetailsPopup.quarryDetailsPopupContent(
              violationData,
              "القائمة"
            );
            handleDetailsPopup(Content);
          }
        } else if (violationOffenderType == "Vehicle") {
          if (popupType == "PaymentFormPrint") {
            handlePaymentFormPrint();
          } else {
            Content = DetailsPopup.vehicleDetailsPopupContent(
              violationData,
              "القائمة"
            );
            handleDetailsPopup(Content);

            let VehcleType = violationData.VehicleType;
            if (VehcleType == "عربة بمقطورة") {
              $(".TrailerNumberBox").show();
            } else {
              $(".TrailerNumberBox").hide();
            }
          }
        } else if (violationOffenderType == "Equipment") {
          if (popupType == "PaymentFormPrint") {
            handlePaymentFormPrint();
          } else {
            Content = DetailsPopup.equipmentDetailsPopupContent(
              violationData,
              "القائمة"
            );
            handleDetailsPopup(Content);
          }
        }
      } else {
        violationData = null;
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

export default runningViolations;
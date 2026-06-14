import functions from "../../Shared/functions";
import sharedApis from "../../Shared/sharedApiCall";
import DetailsPopup from "../../Shared/detailsPopupContent";
import pagination from "../../Shared/Pagination";

let runningSectorTask = {};
runningSectorTask.destroyTable = false;
runningSectorTask.pageIndex = 1;

runningSectorTask.getRunningTasks = (pageIndex = 1, ViolationSector = 0, ViolationType = 0, ViolationGeneralSearch = "") => {
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
      GlobalSearch: $("#violationSearch").val()
    },
  };
  $(".overlay").addClass("active");
  functions.requester("_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Search", {
    request,
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      $(".overlay").removeClass("active");
      let runningTasks = [];
      let ItemsData = data.d.Result;
      if (data.d.Result.GridData != null) {
        if (data.d.Result.GridData.length > 0) {
          Array.from(data.d.Result.GridData).forEach((element) => {
            runningTasks.push(element);
          });
        } else {
          runningTasks = [];
        }
      }
      runningSectorTask.setPaginations(ItemsData.TotalPageCount, ItemsData.RowsPerPage);
      runningSectorTask.runningSectorTaskTable(runningTasks, runningSectorTask.destroyTable);
      runningSectorTask.pageIndex = ItemsData.CurrentPage;
    })
    .catch((err) => {
      $(".overlay").removeClass("active");
      console.log(err);
    });
};

runningSectorTask.setPaginations = (TotalPages, RowsPerPage) => {
  pagination.draw("#paginationID", TotalPages, RowsPerPage);
  pagination.start("#paginationID", runningSectorTask.getRunningTasks);
  pagination.activateCurrentPage();
};

runningSectorTask.exportToExcel = () => {
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
    GlobalSearch: $("#violationSearch").val()
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
      title: "اسم المخالف",
      render: (record) => record.Violation?.ViolatorName || "-",
    },
    {
      title: "نوع المخالفة",
      render: (record) => functions.getViolationArabicName(record.Violation?.OffenderType, record.Violation?.ViolationTypes?.Title),
    },
    {
      title: "تاريخ الإنشاء",
      render: (record) => functions.getFormatedDate(record.Created),
    },
    {
      title: "تاريخ الضبط",
      render: (record) => functions.getFormatedDate(record.Violation?.ViolationDate),
    },
    {
      title: "إسم الشركة المخالفة",
      data: "Violation.ViolatorCompany",
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
      title: "المنطقة",
      data: "Violation.ViolationsZone",
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
    tableSelector: "#SectorManager"
  });
};

runningSectorTask.runningSectorTaskTable = (runningTasks) => {
  let data = [];
  let taskViolation;
  if (runningSectorTask.destroyTable) {
    $("#SectorManager").DataTable().destroy();
  }
  if (runningTasks.length > 0) {
    runningTasks.forEach((record) => {
      taskViolation = record.Violation;
      let createdDate = functions.getFormatedDate(record.Created);

      // Check if violation was rejected before
      const rejectedIndicator = taskViolation?.IsRejectedBefore ?
        '<span class="rejected-indicator" title="تم رفضها سابقاً"></span> ' :
        '';

      data.push([
        `<div class="violationId" style="display: flex;align-items: center;" data-violationid="${taskViolation.ID}" data-taskid="${record.ID}" data-violationcode="${taskViolation.ViolationCode}" data-offendertype="${taskViolation.OffenderType}">
          ${rejectedIndicator}${taskViolation.ViolationCode}
        </div>`,
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
          </div>`,
        `<div class="violationArName">${functions.getViolationArabicName(taskViolation.OffenderType)}</div>`,
        `<div class="violatorName">${taskViolation.ViolatorName || "-"}</div>`,
        `<div class="violationType" data-typeid="${taskViolation.OffenderType == "Quarry" ? taskViolation.ViolationTypes.ID : 0}">${functions.getViolationArabicName(taskViolation.OffenderType, taskViolation?.ViolationTypes?.Title)}</div>`,
        `${createdDate}`,
        `${functions.getFormatedDate(taskViolation.ViolationDate)}`,
        `<div class="companyName">${taskViolation.ViolatorCompany != "" ? taskViolation.ViolatorCompany : "-"}</div>`,
        `<div class="violationCode" >${taskViolation.OffenderType == "Quarry"
          ? taskViolation.QuarryCode
          : taskViolation.CarNumber
        }</div>`,
        `<div class="violationZone">${taskViolation.ViolationsZone || "----"}</div>`,
      ]);
    });
  }
  runningSectorTask.destroyTable = true;
  let Table = functions.tableDeclare(
    "#SectorManager",
    data,
    [
      { title: "رقم المخالفة" },
      { title: "", class: "all" },
      { title: "تصنيف المخالفة" },
      { title: "اسم المخالف" },
      { title: "نوع المخالفة " },
      { title: "تاريخ الإنشاء" },
      { title: "تاريخ الضبط" },
      { title: "إسم الشركة المخالفة" },
      { title: " رقم المحجر/العربة" },
      { title: "المنطقة" },
    ],
    false,
    false,
    "المخالفات القائمة.xlsx",
    "المخالفات القائمة"
  );

  // Create column selector
  functions.createColumnSelector(Table, "#columnSelector", 'green');

  $("#exportBtn").off("click").on("click", () => {
    runningSectorTask.exportToExcel();
  });

  $(".popupForm").addClass("Pendingform");
  $(".Pendingform").find(".totalPriceBox").show();
  $(".Pendingform").find(".dateLimitBox").hide();

  let violationlog = Table.rows().nodes().to$();
  let UserId = _spPageContextInfo.userId;

  functions.callSharePointListApi("Configurations").then(Users => {
    let UserDetails;
    let UsersData = Users.value;
    UsersData.forEach(User => {
      if (User.UserIdId.find(id => id == UserId)) {
        UserDetails = User
      }
    })

    $.each(violationlog, (index, record) => {
      let jQueryRecord = $(record);
      let taskID = jQueryRecord.find(".violationId").data("taskid");
      let violationId = jQueryRecord.find(".violationId").data("violationid");
      let violationCode = jQueryRecord.find(".violationId").data("violationcode");
      let OffenderType = jQueryRecord.find(".violationId").data("offendertype");

      // Add menu items
      jQueryRecord.find(".controls").children(".hiddenListBox").find(".controlsList").append(`
            <li><a href="#" class="confirmViolationPopup">التصديق على المخالفة</a></li>  
            <li><a href="#" class="printConfirmationForm">طباعة نموذج التصديق</a></li>  
            <li><a href="#" class="printPaymentFormOnly">طباعة نموذج السداد</a></li>
        `);

      // Toggle menu
      jQueryRecord.find(".controls").children(".ellipsisButton").on("click", (e) => {
        e.stopPropagation();
        const currentBox = $(e.currentTarget).siblings(".hiddenListBox");
        $(".hiddenListBox").not(currentBox).stop(true, true).hide(300);
        currentBox.stop(true, true).toggle(300);
      });

      // Item details
      jQueryRecord.find(".controls").children(".hiddenListBox").find(".itemDetails").off("click").on("click", (e) => {
        $(".overlay").addClass("active");
        runningSectorTask.findViolationByID(e, taskID, false, UserDetails.JobTitle1);
      });

      // Print violation details
      jQueryRecord.find(".controls").children(".hiddenListBox").find(".printViolationDetails").off("click").on("click", (e) => {
        $(".overlay").addClass("active");
        runningSectorTask.findViolationByID(e, taskID, true)
      });

      // Confirm violation popup
      jQueryRecord.find(".controls").children(".hiddenListBox").find(".confirmViolationPopup").off("click").on("click", (e) => {
        $(".overlay").addClass("active");
        runningSectorTask.violationConfirmPopup(taskID, violationId, violationCode)
      });

      // Print confirmation form
      jQueryRecord.find(".controls").children(".hiddenListBox").find(".printConfirmationForm").off("click").on("click", (e) => {
        $(".overlay").addClass("active");
        runningSectorTask.findViolationByID(e, taskID, false, "", "ConfirmationFormPrint");
      });

      // Print payment form only
      jQueryRecord.find(".controls").children(".hiddenListBox").find(".printPaymentFormOnly").off("click").on("click", (e) => {
        $(".overlay").addClass("active");
        runningSectorTask.printPaymentFormOnly(e, taskID);
      });
    });
  })

  functions.hideTargetElement(".controls", ".hiddenListBox");
};

runningSectorTask.findViolationByID = (event, taskID, print = false, UserJopTitle = "", popupType = "") => {
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
      let violationID;
      let ExDate;

      if (data != null) {
        TaskData = data.d;
        violationData = TaskData.Violation;
        violationID = TaskData.ViolationId;
        violationOffenderType = violationData.OffenderType;
        ExDate = functions.getFormatedDate(TaskData.ReconciliationExpiredDate)

        if (violationOffenderType == "Quarry") {
          if (popupType == "ConfirmationFormPrint") {
            $(".overlay").removeClass("active");
            Content = DetailsPopup.printPaymentForm(TaskData)
            functions.declarePopup(["generalPopupStyle", "paymentFormDetailsPopup"], Content);
          } else {
            Content = DetailsPopup.quarryDetailsPopupContent(violationData, "القائمة");
            printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
            functions.declarePopup(["generalPopupStyle", "detailsPopup"], printBox);
          }
        } else if (violationOffenderType == "Vehicle") {
          let VehcleType = violationData.VehicleType;
          if (popupType == "ConfirmationFormPrint") {
            $(".overlay").removeClass("active");
            Content = DetailsPopup.printPaymentForm(TaskData)
            functions.declarePopup(["generalPopupStyle", "paymentFormDetailsPopup"], Content);
          } else {
            Content = DetailsPopup.vehicleDetailsPopupContent(violationData, "القائمة");
            printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
            functions.declarePopup(["generalPopupStyle", "detailsPopup"], printBox);
          }
          if (VehcleType == "عربة بمقطورة") {
            $(".TrailerNumberBox").show();
          } else {
            $(".TrailerNumberBox").hide();
          }
        } else if (violationOffenderType == "Equipment") {
          if (popupType == "ConfirmationFormPrint") {
            $(".overlay").removeClass("active");
            Content = DetailsPopup.printPaymentForm(TaskData)
            functions.declarePopup(["generalPopupStyle", "paymentFormDetailsPopup"], Content);
          } else {
            Content = DetailsPopup.equipmentDetailsPopupContent(violationData, "القائمة");
            printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
            functions.declarePopup(["generalPopupStyle", "detailsPopup"], printBox);
          }
        }

        if (print) {
          functions.PrintDetails(event);
        }

        // Remove previous handlers before adding new ones
        $(".printBtn").off("click").on("click", (e) => {
          functions.PrintDetails(e);
        });

        // FIX: Hide buttons AFTER rendering
        setTimeout(() => {
          const popup = $(".detailsPopupForm");
          popup.find("#editMaterialMinPrice, #payAllPrice")
            .css("display", "none")
            .attr("style", "display: none !important");
        }, 50);

        $(".printPaymentForm").hide()
        $(".printConfirmationForm").css("display", "flex !important")

        // Remove previous handler before adding new one
        $(".printConfirmationForm").off("click").on("click", (e) => {
          functions.PrintDetails(e);
        })
        $(".detailsPopupForm").addClass("runningTasks")

        $(".popupForm").addClass("Pendingform");
        $(".Pendingform").find(".totalPriceBox").show();
        $(".Pendingform").find(".dateLimitBox").hide();
        $(".Pendingform").find(".showFormula").hide();
        $(".Pendingform").find(".rejectReasonBox").hide();
        $(".totalPriceBox").show().find(".dateLimitBox").hide()

        let editFiles = null;
        let countOfFiles;
        let filesExtension = ["gif", "svg", "jpg", "jpeg", "png", "doc", "docx", "pdf", "xls", "xlsx", "pptx"]
        $(".dropFilesArea").hide()

        // Remove previous handler before adding new one
        $(".attachConfirmationFile").off("change").on("change", (e) => {
          editFiles = $(e.currentTarget)[0].files
          $(".attachmentError").hide();

          if (editFiles.length > 0) {
            $(".dropFilesArea").show().empty()
          } else {
            $(".dropFilesArea").hide()
            editFiles = null;
            return;
          }

          // Validate all files
          let hasInvalidFile = false;
          for (let i = 0; i < editFiles.length; i++) {
            let fileSplited = editFiles[i].name.split(".")
            let fileExt = fileSplited[fileSplited.length - 1].toLowerCase()
            if ($.inArray(fileExt, filesExtension) == -1) {
              functions.warningAlert("من فضلك أدخل الملفات بالمرفقات المسموح بها فقط")
              $(".dropFilesArea").hide()
              $(e.currentTarget).val("")
              editFiles = null;
              hasInvalidFile = true;
              break;
            }
          }

          if (!hasInvalidFile) {
            for (let i = 0; i < editFiles.length; i++) {
              $(".dropFilesArea").append(`
          <div class="file">
            <p class="fileName">${editFiles[i].name}</p>
            <span class="deleteFile" data-index="${i}"><i class="fa-sharp fa-solid fa-x"></i></span>
          </div>
        `);
            }
          }

          // Use event delegation for dynamically added elements
          $(document).off("click", ".deleteFile").on("click", ".deleteFile", (e) => {
            let index = $(e.currentTarget).closest(".file").index()
            $(e.currentTarget).closest(".file").remove()
            let fileBuffer = new DataTransfer()
            for (let i = 0; i < editFiles.length; i++) {
              if (index !== i) {
                fileBuffer.items.add(editFiles[i]);
              }
            }
            editFiles = fileBuffer.files
            countOfFiles = editFiles.length
            if (countOfFiles == 0) {
              $(".dropFilesArea").hide()
              editFiles = null;
              $("#attachConfirmationFile").val("");
            }
          })
        })

        // Remove previous handler before adding new one
        $(".confirmViolation").off("click").on("click", (e) => {
          if (!editFiles || editFiles.length === 0) {
            functions.warningAlert("من فضلك قم بإرفاق مستندات التصديق");
            return;
          }

          let request = {
            Data: {
              ID: taskID,
              ViolationId: violationID,
              Status: "Confirmed",
              PaymentStatus: "قيد الإنتظار",
            },
          };
          $(".overlay").addClass("active");
          runningSectorTask.violationConfirmRequest(taskID, request);
        });
      } else {
        violationData = null;
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

runningSectorTask.printPaymentFormOnly = (event, taskID) => {
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
      let Content;

      if (data != null) {
        TaskData = data.d;
        violationData = TaskData.Violation;

        $(".overlay").removeClass("active");
        Content = DetailsPopup.printConfirmationFormOnly(TaskData);
        functions.declarePopup(["generalPopupStyle", "paymentFormDetailsPopup"], Content);

        // Add print and close button handlers
        setTimeout(() => {
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
runningSectorTask.violationConfirmPopup = (TaskId, violationID, violationCode) => {
  $(".overlay").removeClass("active");
  let popupHtml = `
    <div class="popupHeader" style="display: flex; justify-content: space-between;">
      <div class="violationsCode"> 
          <p> كود المخالفة رقم ${violationCode}</p>
      </div>
      <div class="btnStyle cancelBtn popupBtn closeViolationConfirmPopup" id="closeViolationConfirmPopup" style="color: #fff; cursor: pointer;" data-dismiss="modal" aria-label="Close">
          <i class="fa-solid fa-x"></i>
      </div>
    </div>
    <div class="popupBody">
      <div class="popupForm detailsPopupForm" id="detailsPopupForm">
          
          <div class="formContent">
              <div class="formBox">
                  <div class="formElements">
                      <div class="row">
                        <div class="col-12">
                            <div class="form-group customFormGroup">
                                <label for="attachEditFile" class="customLabel">إرفاق مستند <span class="required-star">*</span></label>
                                <div class="fileBox" id="dropContainer">
                                    <div class="inputFileBox">
                                        <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                        <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                        <input type="file" class="customInput attachFilesInput attachConfirmationFile form-control" id="attachConfirmationFile" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx" multiple required>
                                    </div>
                                </div>
                                <div class="dropFilesArea" id="dropFilesArea"></div>
                            </div>
                        </div>
                      </div>
                  </div>
              </div>
          </div>

          <div class="formButtonsBox">
              <div class="row">
                  <div class="col-12">
                      <div class="buttonsBox centerButtonsBox ">
                          <div class="btnStyle confirmBtnGreen popupBtn confirmViolation" id="confirmViolation">تصديق</div>
                          <div class="btnStyle cancelBtn popupBtn" id="closeViolationConfirmPopupFooter" data-dismiss="modal" aria-label="Close">إلغاء</div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  `;

  functions.declarePopup(["generalPopupStyle", "greenPopup", "editPopup"], popupHtml);

  // Add close button handlers
  $("#closeViolationConfirmPopup, #closeViolationConfirmPopupFooter").on("click", function () {
    functions.closePopup();
  });

  let request = {}
  let editFiles = null;
  let countOfFiles;
  let filesExtension = ["gif", "svg", "jpg", "jpeg", "png", "doc", "docx", "pdf", "xls", "xlsx", "pptx"]
  $(".dropFilesArea").hide()

  $(".attachConfirmationFile").on("change", (e) => {
    editFiles = $(e.currentTarget)[0].files
    $("#attachmentError").hide();

    if (editFiles.length > 0) {
      $(".dropFilesArea").show().empty()
    } else {
      $(".dropFilesArea").hide()
      editFiles = null;
      return;
    }

    // Validate all files before adding to the list
    let hasInvalidFile = false;
    for (let i = 0; i < editFiles.length; i++) {
      let fileSplited = editFiles[i].name.split(".")
      let fileExt = fileSplited[fileSplited.length - 1].toLowerCase()
      if ($.inArray(fileExt, filesExtension) == -1) {
        functions.warningAlert("من فضلك أدخل الملفات بالمرفقات المسموح بها فقط")
        $(".dropFilesArea").hide()
        $(e.currentTarget).val("")
        editFiles = null;
        hasInvalidFile = true;
        break;
      }
    }

    if (!hasInvalidFile) {
      for (let i = 0; i < editFiles.length; i++) {
        $(".dropFilesArea").append(`
          <div class="file">
            <p class="fileName">${editFiles[i].name}</p>
            <span class="deleteFile" data-index="${i}"><i class="fa-sharp fa-solid fa-x"></i></span>
          </div>
        `);
      }

      $(".deleteFile").on("click", (e) => {
        let index = $(e.currentTarget).closest(".file").index()
        $(e.currentTarget).closest(".file").remove()
        let fileBuffer = new DataTransfer()
        for (let i = 0; i < editFiles.length; i++) {
          if (index !== i) {
            fileBuffer.items.add(editFiles[i]);
          }
        }
        editFiles = fileBuffer.files
        countOfFiles = editFiles.length
        if (countOfFiles == 0) {
          $(".dropFilesArea").hide()
          editFiles = null;
          $("#attachConfirmationFile").val("");
        }
      })
    }
  })

  // Enhanced validation for confirm button
  $("#confirmViolation").on("click", (e) => {
    // Check if files are attached
    if (!editFiles || editFiles.length === 0) {
      $("#attachmentError").show();
      functions.warningAlert("من فضلك قم بإرفاق مستندات التصديق");
      return;
    }

    // Additional validation to ensure all files are valid
    let allFilesValid = true;
    for (let i = 0; i < editFiles.length; i++) {
      let fileSplited = editFiles[i].name.split(".");
      let fileExt = fileSplited[fileSplited.length - 1].toLowerCase();
      if ($.inArray(fileExt, filesExtension) === -1) {
        allFilesValid = false;
        break;
      }
    }

    if (!allFilesValid) {
      functions.warningAlert("يوجد ملفات غير صالحة، يرجى التحقق من امتدادات الملفات");
      return;
    }

    request = {
      Data: {
        ID: TaskId,
        ViolationId: violationID,
        Status: "Confirmed",
        PaymentStatus: "قيد الإنتظار"
      }
    }
    $(".overlay").addClass("active");
    runningSectorTask.violationConfirmRequest(TaskId, request)
  });
};

runningSectorTask.violationConfirmRequest = (TaskId, request) => {
  functions
    .requester("/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Save", {
      request,
    })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      runningSectorTask.uploadConfirmAttachment(TaskId, "ViolationsCycle");
    })
    .catch((err) => {
      console.log(err);
    });
};

runningSectorTask.uploadConfirmAttachment = (taskID, ListName) => {
  let Data = new FormData();
  Data.append("itemId", taskID);
  Data.append("listName", ListName);
  for (let i = 0; i <= $("#attachConfirmationFile")[0].files.length; i++) {
    Data.append("file" + i, $("#attachConfirmationFile")[0].files[i]);
  }
  $.ajax({
    type: "POST",
    url: "/_layouts/15/Uranium.Violations.SharePoint/Attachments.aspx/Upload",
    processData: false,
    contentType: false,
    data: Data,
    success: (data) => {
      $(".overlay").removeClass("active");
      functions.sucessAlert("تم التصديق على المخالفة بنجاح ");
    },
    error: (err) => {
      functions.warningAlert("خطأ في إرسال البيانات لقاعدة البيانات");
      $(".overlay").removeClass("active");
      console.log(err.responseText);
    },
  });
};

runningSectorTask.filterTasksLog = (e) => {
  let pageIndex = runningSectorTask.pageIndex;
  let ViolationSectorVal = $("#violationSector").children("option:selected").val();
  let ViolationTypeVal = $("#TypeofViolation").children("option:selected").data("id");
  let ViolationGeneralSearch = $("#violationSearch").val();
  let ViolationType;
  let ViolationSector;

  if (ViolationTypeVal == "" && ViolationSectorVal == "" && ViolationGeneralSearch == "") {
    functions.warningAlert(
      "من فضلك قم بإدخال قيمة واحدة على الأقل من قيم البحث"
    );
  } else if (ViolationSectorVal != "" || ViolationTypeVal != "0" || ViolationGeneralSearch != "") {
    $(".overlay").addClass("active");
    ViolationSector = Number($("#violationSector").children("option:selected").val());
    ViolationType = Number(
      $("#TypeofViolation").children("option:selected").data("id")
    );
    runningSectorTask.getRunningTasks(pageIndex, ViolationSector, ViolationType, ViolationGeneralSearch);
  }
};

runningSectorTask.resetFilter = (e) => {
  e.preventDefault();
  $("#violationSector").val("0");
  $("#TypeofViolation").val("0");
  $("#violationSearch").val("");

  pagination.reset();
  runningSectorTask.pageIndex = 1;

  $(".overlay").addClass("active");

  runningSectorTask.getRunningTasks(1, 0, 0, "");
};
export default runningSectorTask;

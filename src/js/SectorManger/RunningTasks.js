import functions from "../../Shared/functions";
import sharedApis from "../../Shared/sharedApiCall";
import DetailsPopup from "../../Shared/detailsPopupContent";
import Swal from "sweetalert2";
import pagination from "../../Shared/Pagination";

let runningSectorTask = {};
runningSectorTask.pageIndex = 1;

runningSectorTask.getRunningTasks = (
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
      Status: "Approved",
      PaymentStatus: "",
      ViolationType: ViolationType,
      ViolationsZone: ViolationZone,
    },
  };
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
      $(".PreLoader").removeClass("active");
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
      runningSectorTask.setPaginations(
        ItemsData.TotalPageCount,
        ItemsData.RowsPerPage
      );
      runningSectorTask.runningSectorTaskTable(runningTasks, destroyTable);
      runningSectorTask.pageIndex = ItemsData.CurrentPage;
    })
    .catch((err) => {
      console.log(err);
    });
};

runningSectorTask.setPaginations = (TotalPages, RowsPerPage) => {
  pagination.draw("#paginationID", TotalPages, RowsPerPage);
  pagination.start("#paginationID", runningSectorTask.getRunningTasks);
  // pagination.reset()
  // pagination.scrollToElement(el, length)
  pagination.activateCurrentPage();
};

runningSectorTask.runningSectorTaskTable = (runningTasks, destroyTable) => {
  let data = [];
  let taskViolation;
  if (runningTasks.length > 0) {
    runningTasks.forEach((record) => {
      taskViolation = record.Violation;
      data.push([
        `<div class="violationId" data-violationid="${taskViolation.ID}" data-taskid="${record.ID}" data-violationcode="${taskViolation.ViolationCode}" data-offendertype="${taskViolation.OffenderType}">${taskViolation.ViolationCode}</div>`,
        `<div class="violationArName">${functions.getViolationArabicName(
          taskViolation.OffenderType
        )}</div>`,
        `<div class="violationCode" >${
          taskViolation.OffenderType == "Quarry"
            ? taskViolation.QuarryCode
            : taskViolation.CarNumber
        }</div>`,
        `<div class="companyName">${taskViolation.ViolatorCompany}</div>`,
        `<div class="violationType" data-typeid="${taskViolation.ViolationTypes.ID}">${taskViolation.ViolationTypes.Title}</div>`,
        `<div class="violationZone">${taskViolation.ViolationsZone}</div>`,
        `${functions.getFormatedDate(taskViolation.ViolationDate)}`,
        `<div class='controls'>
              <div class='ellipsisButton'>
                  <i class='fa-solid fa-ellipsis-vertical'></i>
              </div>
              <div class="hiddenListBox">
                  <div class='arrow'></div>
                  <ul class='list-unstyled controlsList'>
                      <li><a href="#" class="itemDetails"> المزيد من التفاصيل</a></li> 
                      <li><a href="#" class="printViolationDetails"> طباعة التقرير</a></li>               
                      <li><a href="#" class="confirmViolationPopup">التصديق على المخالفة</a></li>                     
                  </ul>
              </div>
          </div`,
      ]);
    });
  }
  let Table = functions.tableDeclare(
    "#SectorManager",
    data,
    [
      { title: "رقم المخالفة" },
      { title: "تصنيف المخالفة" },
      { title: " رقم المحجر/العربة" },
      { title: "إسم الشركة المخالفة" },
      { title: "نوع المخالفة " },
      { title: "المنطقة" },
      { title: "تاريخ الضبط" },
      { title: "", class: "all" },
    ],
    false,
    destroyTable
  );
  let violationlog = Table.rows().nodes().to$();
  $.each(violationlog, (index, record) => {
    let jQueryRecord = $(record);
    let taskID = jQueryRecord.find(".violationId").data("taskid");
    let violationId = jQueryRecord.find(".violationId").data("violationid");
    let violationCode = jQueryRecord.find(".violationId").data("violationcode");
    let OffenderType = jQueryRecord.find(".violationId").data("offendertype");
    // console.log("violationID))", taskID);
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
        runningSectorTask.findViolationByID(taskID);
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
            taskViolation,
            "القائمة"
          );
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          functions.declarePopup(
            ["generalPopupStyle", "detailsPopup"],
            printBox
          );
        } else {
          Content = DetailsPopup.vehicleDetailsPopupContent(
            taskViolation,
            "القائمة"
          );
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          functions.declarePopup(
            ["generalPopupStyle", "detailsPopup"],
            printBox
          );
        }
        functions.PrintDetails(e);
      });
    jQueryRecord
      .find(".controls")
      .children(".hiddenListBox")
      .find(".confirmViolationPopup")
      .on("click", (e) => {
        $(".overlay").addClass("active");
        runningSectorTask.violationConfirmPopup(
          taskID,
          violationId,
          violationCode
        );
      });
  });
  functions.hideTargetElement(".controls", ".hiddenListBox");
};

runningSectorTask.findViolationByID = (taskID) => {
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
            "القائمة"
          );
          printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
          functions.declarePopup(
            ["generalPopupStyle", "detailsPopup", "blueHeaderPopup"],
            printBox
          );
        } else {
          Content = DetailsPopup.vehicleDetailsPopupContent(
            violationData,
            "القائمة"
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

        $(".addConfirmationAttchBox").show();
        $(".totalPriceBox").show().find(".dateLimitBox").hide();
        $(".confirmViolation").css("display", "flex");
        let editFiles;
        let countOfFiles;
        $(".dropFilesArea").hide();
        $(".attachConfirmationFile").on("change", (e) => {
          editFiles = $(e.currentTarget)[0].files;
          if (editFiles.length > 0) {
            $(".dropFilesArea").show().empty();
          }
          for (let i = 0; i < editFiles.length; i++) {
            $(".dropFilesArea").append(`
                    <div class="file">
                        <p class="fileName">${editFiles[i].name}</p>
                        <span class="deleteFile" data-index="${i}"><i class="fa-sharp fa-solid fa-x"></i></span>
                    </div>
                `);
          }
          $(".deleteFile").on("click", (e) => {
            let index = $(e.currentTarget).closest(".file").index();
            $(e.currentTarget).closest(".file").remove();
            let fileBuffer = new DataTransfer();
            for (let i = 0; i < editFiles.length; i++) {
              if (index !== i) {
                fileBuffer.items.add(editFiles[i]);
              }
            }
            editFiles = fileBuffer.files;
            countOfFiles = editFiles.length;
            if (countOfFiles == 0) {
              $(".dropFilesArea").hide();
            }
          });
        });
        $(".confirmViolation").on("click", (e) => {
          if (editFiles != null && editFiles.length > 0) {
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
          } else {
            functions.warningAlert("من فضلك قم بإرفاق مستندات التصديق");
          }
        });
      } else {
        violationData = null;
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

runningSectorTask.violationConfirmPopup = (
  TaskId,
  violationID,
  violationCode
) => {
  $(".overlay").removeClass("active");
  let popupHtml = `
    <div class="popupHeader">
      <div class="violationsCode"> 
          <p> كود المخالفة رقم ${violationCode}</p>
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
                                <label for="attachEditFile" class="customLabel">إرفاق مستند</label>
                                <div class="fileBox" id="dropContainer">
                                    <div class="inputFileBox">
                                        <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                        <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                        <input type="file" class="customInput attachFilesInput attachConfirmationFile form-control" id="attachConfirmationFile" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx" multiple>
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
                          <div class="btnStyle confirmBtn popupBtn confirmViolation" id="confirmViolation">تصديق</div>
                          <div class="btnStyle cancelBtn popupBtn closeDetailsPopup" id="closeDetailsPopup" data-dismiss="modal" aria-label="Close">إلغاء</div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  `;
  functions.declarePopup(
    ["generalPopupStyle", "bluePopup", "editPopup"],
    popupHtml
  );
  let request = {};
  let editFiles;
  let countOfFiles;
  $(".dropFilesArea").hide();
  $(".attachConfirmationFile").on("change", (e) => {
    editFiles = $(e.currentTarget)[0].files;
    if (editFiles.length > 0) {
      $(".dropFilesArea").show().empty();
    }
    for (let i = 0; i < editFiles.length; i++) {
      $(".dropFilesArea").append(`
              <div class="file">
                  <p class="fileName">${editFiles[i].name}</p>
                  <span class="deleteFile" data-index="${i}"><i class="fa-sharp fa-solid fa-x"></i></span>
              </div>
          `);
    }
    $(".deleteFile").on("click", (e) => {
      let index = $(e.currentTarget).closest(".file").index();
      $(e.currentTarget).closest(".file").remove();
      let fileBuffer = new DataTransfer();
      for (let i = 0; i < editFiles.length; i++) {
        if (index !== i) {
          fileBuffer.items.add(editFiles[i]);
        }
      }
      editFiles = fileBuffer.files;
      countOfFiles = editFiles.length;
      if (countOfFiles == 0) {
        $(".dropFilesArea").hide();
      }
    });
  });

  $("#confirmViolation").on("click", (e) => {
    if (editFiles != null && editFiles.length > 0) {
      request = {
        Data: {
          ID: TaskId,
          ViolationId: violationID,
          Status: "Confirmed",
          PaymentStatus: "قيد الإنتظار",
        },
      };
      $(".overlay").addClass("active");
      runningSectorTask.violationConfirmRequest(TaskId, request);
    } else {
      functions.warningAlert("من فضلك قم بإرفاق مستندات التصديق");
    }
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
      console.log(data);
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
    runningSectorTask.getRunningTasks(
      pageIndex,
      true,
      ViolationZone,
      ViolationType
    );
  }
};

export default runningSectorTask;

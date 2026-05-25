import functions from "../../Shared/functions";
import DetailsPopup from "../../Shared/detailsPopupContent";
import pagination from "../../Shared/Pagination";

let ExternalViolationLog = {
    pageIndex: 1,
    destroyTable: false
};

ExternalViolationLog.getExternalViolations = (
    pageIndex = 1,
    destroyTable = false,
) => {
    let request = {
        Data: {
            RowsPerPage: 10,
            PageIndex: pagination.currentPage,
            ColName: "created",
            SortOrder: "desc",
            IsExternalRecord: true,
            Status: "ExternalReviewed",  // will delete if counters ok
            CaseNumber: $("#caseNumber").val(),
            ViolationCode: $("#violationCode").val(),
            CreatedFrom: $("#createdFrom").val()
                ? moment($("#createdFrom").val(), "DD-MM-YYYY").format("YYYY-MM-DD")
                : null,
            CreatedTo: $("#createdTo").val()
                ? moment($("#createdTo").val(), "DD-MM-YYYY").format("YYYY-MM-DD")
                : null,
        }
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
            let ExternalViolationDate = [];
            let ItemsData = data.d.Result;
            if (data.d.Result.GridData != null) {
                if (data.d.Result.GridData.length > 0) {
                    Array.from(data.d.Result.GridData).forEach((element) => {
                        ExternalViolationDate.push(element);
                    });
                } else {
                    ExternalViolationDate = [];
                }
            }

            ExternalViolationLog.setPaginations(ItemsData.TotalPageCount, ItemsData.RowsPerPage);
            ExternalViolationLog.ExternalViolationTable(ExternalViolationDate, destroyTable);
            ExternalViolationLog.pageIndex = ItemsData.CurrentPage;
        })
        .catch((err) => {
            console.log(err);
        });
};

ExternalViolationLog.setPaginations = (TotalPages, RowsPerPage) => {
    pagination.draw("#paginationID", TotalPages, RowsPerPage);
    pagination.start("#paginationID", ExternalViolationLog.getExternalViolations);
    pagination.activateCurrentPage();
};
ExternalViolationLog.filterExternalViolations = () => {
    let pageIndex = ExternalViolationLog.pageIndex;

    $(".PreLoader").addClass("active");
    ExternalViolationLog.getExternalViolations(
        pageIndex,
        true
    );
};

ExternalViolationLog.resetFilter = (e) => {
    e.preventDefault();
    $("#caseNumber").val("");
    $("#violationCode").val("");
    $("#createdFrom").val("");
    $("#createdTo").val("");

    $(".PreLoader").addClass("active");
    pagination.reset();
    ExternalViolationLog.getExternalViolations();
};
ExternalViolationLog.ExternalViolationTable = (ExternalViolationDate, destroyTable) => {
    let data = [];

    if (ExternalViolationDate.length > 0) {
        ExternalViolationDate.forEach(record => {
            let v = record.Violation;
            if (!v) return;

            // Get violation status from the task record
            let violationStatus = record.Status || record.StatusAr || "";

            // Check if violation is cancelled
            let isCancelled = violationStatus === "Cancelled";

            // Get the current amount (TotalPriceDue or ActualAmountPaid)
            let currentAmount = v?.TotalPriceDue;

            data.push([
                `<div class="violationId"
                    data-taskid="${record.ID}"
                    data-violationid="${v.ID}"
                    data-offendertype="${v.OffenderType}"
                    data-violationcode="${v.ViolationCode}"
                    data-casenumber="${v.CaseNumber}"
                    data-violationstatus="${violationStatus}"
                    data-iscancelled="${isCancelled}"
                    data-totalprice="${currentAmount}">
                    ${v.ViolationCode || "---"}
                </div>`,

                `<div class="controls">
                    <div class="ellipsisButton">
                        <i class="fa-solid fa-ellipsis-vertical"></i>
                    </div>
                    <div class="hiddenListBox">
                        <div class="arrow"></div>
                        <ul class="list-unstyled controlsList">
                            <li>
                                <a href="#" class="itemDetails">المزيد من التفاصيل</a>
                            </li>
                            <li>
                                <a href="#" 
                                data-violationid="${v.ID}" 
                                data-violationcode="${v.ViolationCode}" 
                                class="violationHistoryExternal" 
                                data-toggle="modal" 
                                data-target="#trackHistoryModalExternal">
                                تتبع مرحلة المخالفة
                                </a>
                            </li>
                            ${!isCancelled ? `
                            <li>
                                <a href="#" class="editViolationAmountAction">تعديل مبلغ السداد</a>
                            </li>
                            <li>
                                <a href="#" class="saveExternalCaseAction">حفظ وإلغاء قرار النيابة</a>
                            </li>
                            ` : ''}
                        </ul>
                    </div>
                </div>`,
                `<div>${functions.getViolationArabicName(v.OffenderType)}</div>`,
                `<div>${functions.getViolationArabicName(
                    v.OffenderType,
                    v?.ViolationTypes?.Title
                )}</div>`,
                `<div>${v.ViolatorCompany || "-"}</div>`,
                `<div>${v.CaseNumber || "---"}</div>`,
                `<div>${v.AssignedProsecution || "---"}</div>`,
                `<div>${v.Governrates?.Title || "---"}</div>`,
                `<div>
                    <span class="status-badge ${isCancelled ? 'status-cancelled' : 'status-active'}">${getViolationStatusText(violationStatus)}</span>
                </div>`
            ]);
        });
    }

    if (ExternalViolationLog.destroyTable || destroyTable) {
        $("#ExternalViolationLog").DataTable().destroy();
    }

    let Table = functions.tableDeclare(
        "#ExternalViolationLog",
        data,
        [
            { title: "رقم المخالفة" },
            { title: "", class: "all" },
            { title: "تصنيف المخالفة" },
            { title: "نوع المخالفة" },
            { title: "إسم الشركة المخالفة" },
            { title: "رقم القضية" },
            { title: "النيابة المختصة" },
            { title: "جهة الضبط" },
            { title: "حالة المخالفة" }
        ],
        false,
        false,
        "سجل المخالفات الخارجية.xlsx",
        "سجل المخالفات الخارجية"
    );

    // 🔹 create column selector
    functions.createColumnSelector(Table, "#columnSelector", 'green');

    ExternalViolationLog.destroyTable = true;

    $(".ellipsisButton").on("click", (e) => {
        $(".hiddenListBox").hide(300);
        $(e.currentTarget).siblings(".hiddenListBox").toggle(300);
    });

    let violationlog = Table.rows().nodes().to$();
    let UserId = _spPageContextInfo.userId;
    functions.callSharePointListApi("Configurations").then((Users) => {
        let UserDetails = null;
        let UsersData = Users.value;
        UsersData.forEach((User) => {
            if (User.UserIdId.find((id) => id == UserId)) {
                UserDetails = User;
            }
        });

        $.each(violationlog, (index, record) => {
            let jQueryRecord = $(record);
            let taskID = jQueryRecord.find(".violationId").data("taskid");
            let hiddenListBox = jQueryRecord
                .find(".controls")
                .children(".hiddenListBox");

            // if (
            //     violationlog.length > 4 &&
            //     hiddenListBox.height() > 110 &&
            //     jQueryRecord.is(":nth-last-child(-n + 4)")
            // ) {
            //     hiddenListBox.addClass("toTopDDL");
            // }

            jQueryRecord
                .find(".controls")
                .children(".hiddenListBox")
                .find(".itemDetails")
                .on("click", (e) => {
                    $(".overlay").addClass("active");
                    ExternalViolationLog.findViolationByID(
                        e,
                        taskID,
                        false
                    );
                });

            // Edit Violation Amount Action
            jQueryRecord
                .find(".controls")
                .children(".hiddenListBox")
                .find(".editViolationAmountAction")
                .on("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    let violationID = jQueryRecord.find(".violationId").data("violationid");
                    let violationCode = jQueryRecord.find(".violationId").data("violationcode");
                    let currentAmount = jQueryRecord.find(".violationId").data("totalprice");
                    let caseNumber = jQueryRecord.find(".violationId").data("casenumber");

                    ExternalViolationLog.editExternalViolationAmountPopup(
                        taskID,
                        violationID,
                        violationCode,
                        caseNumber,
                        currentAmount
                    );

                    $(".hiddenListBox").hide(300);
                });

            // Save case action
            jQueryRecord
                .find(".controls")
                .children(".hiddenListBox")
                .find(".saveExternalCaseAction")
                .on("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    let violationID = jQueryRecord.find(".violationId").data("violationid");
                    let violationCode = jQueryRecord.find(".violationId").data("violationcode");
                    let caseNumber = jQueryRecord.find(".violationId").data("casenumber");

                    $(".hiddenListBox").hide(300);
                    ExternalViolationLog.saveCaseAndCancelViolationPopup(
                        taskID,
                        violationID,
                        violationCode,
                        caseNumber
                    );
                });
        });
    });

    functions.hideTargetElement(".controls", ".hiddenListBox");
};

// Helper function to get violation status text in Arabic
function getViolationStatusText(status) {
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
        "UnderReview": "منظورة",
        "ExternalReviewed": "منظورة",
        "Completed": "مكتملة",
        "Cancelled": "ملغاه"
    };

    return statusMap[status] || status || '---';
}

// ExternalViolationLog.bindTableEvents = (table) => {

//     $(document)
//         .off("click", ".ellipsisButton")
//         .on("click", ".ellipsisButton", function () {
//             $(".hiddenListBox").hide(200);
//             $(this).siblings(".hiddenListBox").toggle(200);
//         });

//     $(document)
//         .off("click", ".itemDetails")
//         .on("click", ".itemDetails", function (e) {
//             e.preventDefault();
//             let taskID = $(this)
//                 .closest("tr")
//                 .find(".violationId")
//                 .data("taskid");

//             $(".overlay").addClass("active");
//             ExternalViolationLog.findViolationByID(taskID);
//         });

//     functions.hideTargetElement(".controls", ".hiddenListBox");
// };

ExternalViolationLog.findViolationByID = (event, taskID, print = false) => {
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
                        "منظورة خارجياً"
                    );
                    printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
                    functions.declarePopup(
                        ["generalPopupStyle", "detailsPopup"],
                        printBox
                    );
                } else if (violationOffenderType == "Vehicle") {
                    Content = DetailsPopup.vehicleDetailsPopupContent(
                        violationData,
                        "منظورة خارجياً"
                    );
                    printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
                    functions.declarePopup(
                        ["generalPopupStyle", "detailsPopup"],
                        printBox
                    );

                    // Handle vehicle type for trailer
                    let VehcleType = violationData.VehicleType;
                    if (VehcleType == "عربة بمقطورة") {
                        $(".TrailerNumberBox").show();
                    } else {
                        $(".TrailerNumberBox").hide();
                    }
                } else if (violationOffenderType == "Equipment") {
                    Content = DetailsPopup.equipmentDetailsPopupContent(
                        violationData,
                        "منظورة خارجياً"
                    );
                    printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
                    functions.declarePopup(
                        ["generalPopupStyle", "detailsPopup"],
                        printBox
                    );
                }

                // Add class to identify this popup
                $(".popupForm").addClass("Externalform");

                // Hide/show appropriate sections based on context
                $(".totalPriceBox").show().find(".dateLimitBox").hide();
                $(".confirmationAttachBox").show();
                $(".Externalform").find(".addConfirmationAttchBox").hide();
                $(".Externalform").find(".rejectReasonBox").hide();
                $(".Externalform").find(".showFormula").hide();

                // Handle print functionality
                if (print) {
                    $(".Externalform").find(".confirmationAttachBox").show();
                    functions.PrintDetails(event);
                }

                $(".printBtn").on("click", (e) => {
                    functions.PrintDetails(e);
                });

                $(".detailsPopupForm").addClass("externalTasks");

                // Get attachments if needed
                DetailsPopup.getConfirmationAttachments(taskID);
            } else {
                violationData = null;
            }
        })
        .catch((err) => {
            console.log(err);
        });
};

///////////// save case and cancel popup /////////////
ExternalViolationLog.saveCaseAndCancelViolationPopup = (
    TaskID,
    ViolationID,
    violationCode,
    caseNumber
) => {
    $(".overlay").removeClass("active");

    let title = violationCode
        ? `حفظ القضية وإلغاء المخالفة - المخالفة رقم (${violationCode})`
        : `حفظ القضية وإلغاء المخالفة`;

    let popupHtml = `
        <div class="popupHeader" style="display: flex; justify-content: space-between;">
            <div class="violationsCode"> 
                <p>${title}</p>
            </div>
            <div class="btnStyle cancelBtn popupBtn closeSaveCasePopup" id="closeSaveCasePopup" style="color: #fff; cursor: pointer;" data-dismiss="modal" aria-label="Close">
                <i class="fa-solid fa-x"></i>
            </div>
        </div>
        <div class="popupBody">
            <div class="popupForm detailsPopupForm" id="detailsPopupForm">
                <div class="formContent">
                    <div class="formBox">
                        <div class="formElements">
                            <div class="row">
                                <div class="col-md-12">
                                    <div class="form-group customFormGroup">
                                        <label for="saveCaseComments" class="customLabel">ملاحظات</label>
                                        <textarea class="form-control customTextArea saveCaseComments" id="saveCaseComments" rows="3" placeholder="أدخل الملاحظات"></textarea>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="form-group customFormGroup">
                                        <label for="saveCaseAttachment" class="customLabel">إرفاق المستندات <span style="color: red;">*</span></label>
                                        <div class="fileBox" id="dropContainer">
                                            <div class="inputFileBox">
                                                <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                                <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                                <input type="file" class="customInput attachFilesInput saveCaseAttachment form-control" id="saveCaseAttachment" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx" multiple>
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
                            <div class="buttonsBox centerButtonsBox">
                                <div class="btnStyle confirmBtnGreen popupBtn confirmSaveCaseBtn" id="confirmSaveCaseBtn">تأكيد</div>
                                <div class="btnStyle cancelBtn popupBtn closeSaveCasePopupFooter" id="closeSaveCasePopupFooter" data-dismiss="modal" aria-label="Close">إلغاء</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

    functions.declarePopup(
        ["generalPopupStyle", "greenPopup", "editPopup"],
        popupHtml
    );

    // Add close button handlers
    $("#closeSaveCasePopup, #closeSaveCasePopupFooter").on("click", function () {
        functions.closePopup();
    });

    let filesExtension = [
        "gif", "svg", "jpg", "jpeg", "png",
        "doc", "docx", "pdf", "xls", "xlsx", "pptx"
    ];
    let allAttachments;
    let countOfFiles;
    let SaveCaseCommentsInput = "";

    // Handle comments input
    $("#saveCaseComments").on("input", (e) => {
        SaveCaseCommentsInput = $(e.currentTarget).val().trim();
    });

    // File attachment handling
    $("#saveCaseAttachment").on("change", (e) => {
        allAttachments = $(e.currentTarget)[0].files;
        if (allAttachments.length > 0) {
            $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").show().empty();
        }
        for (let i = 0; i < allAttachments.length; i++) {
            $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").append(`
                <div class="file">
                    <p class="fileName">${allAttachments[i].name}</p>
                    <span class="deleteFile" data-index="${i}"><i class="fa-sharp fa-solid fa-x"></i></span>
                </div>
            `);
        }

        $(".deleteFile").on("click", (event) => {
            let index = $(event.currentTarget).closest(".file").index();
            $(event.currentTarget).closest(".file").remove();
            let fileBuffer = new DataTransfer();
            for (let i = 0; i < allAttachments.length; i++) {
                if (index !== i) {
                    fileBuffer.items.add(allAttachments[i]);
                }
            }
            allAttachments = fileBuffer.files;
            countOfFiles = allAttachments.length;
            if (countOfFiles == 0) {
                $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
            }
        });

        for (let i = 0; i < allAttachments.length; i++) {
            let fileSplited = allAttachments[i].name.split(".");
            let fileExt = fileSplited[fileSplited.length - 1].toLowerCase();
            if ($.inArray(fileExt, filesExtension) == -1) {
                functions.warningAlert("من فضلك أدخل الملفات بالامتدادات المسموح بها فقط");
                $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
                $(e.currentTarget).val("");
            }
        }
    });

    // Confirm Save Case button handler
    $("#confirmSaveCaseBtn").on("click", (e) => {
        if (allAttachments != null && allAttachments.length > 0) {
            $(".overlay").addClass("active");

            // First cancel the violation task (set status to "Cancelled")
            ExternalViolationLog.cancelTaskAndUploadAttachment(
                TaskID,
                ViolationID,
                SaveCaseCommentsInput,
                "#saveCaseAttachment"
            );
        } else {
            functions.warningAlert("من فضلك قم بإرفاق المستندات المطلوبة");
        }
    });
};

// Cancel the task and upload attachment to Violations list
ExternalViolationLog.cancelTaskAndUploadAttachment = (
    TaskID,
    ViolationID,
    Comments,
    attachInput
) => {
    // Step 1: Cancel the task by updating its status to "Cancelled"
    let cancelTaskRequest = {
        request: {
            Data: {
                ID: TaskID,
                ViolationId: ViolationID,
                Status: "Cancelled",
                Comment: Comments
            }
        }
    };

    functions
        .requester(
            "/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Save",
            cancelTaskRequest
        )
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
        })
        .then((data) => {
            if (data.d && data.d.Status) {
                // Step 2: Upload attachment to Violations list (ViolationsCycle)
                ExternalViolationLog.uploadSaveCaseAttachmentToViolation(
                    ViolationID,
                    attachInput,
                    Comments
                );
            } else {
                $(".overlay").removeClass("active");
                functions.warningAlert("حدث خطأ أثناء حفظ القضية");
            }
        })
        .catch((err) => {
            console.error("Error canceling task:", err);
            $(".overlay").removeClass("active");
            functions.warningAlert("حدث خطأ أثناء حفظ القضية");
        });
};

// Upload attachment to the Violation item
ExternalViolationLog.uploadSaveCaseAttachmentToViolation = (
    ViolationID,
    attachInput,
    Comments
) => {
    let Data = new FormData();
    Data.append("itemId", ViolationID);
    Data.append("listName", "Violations"); // Upload to Violations list

    let filesInput = $(attachInput)[0];
    for (let i = 0; i <= filesInput.files.length; i++) {
        Data.append("file" + i, filesInput.files[i]);
    }

    $.ajax({
        type: "POST",
        url: "/_layouts/15/Uranium.Violations.SharePoint/Attachments.aspx/Upload",
        processData: false,
        contentType: false,
        data: Data,
        success: (data) => {
            $(".overlay").removeClass("active");
            functions.sucessAlert("تم إلغاء المخالفة بنجاح");
            functions.closePopup();
        },
        error: (err) => {
            $(".overlay").removeClass("active");
            functions.warningAlert("تم إلغاء المخالفة ولكن حدث خطأ في رفع المرفقات");
            console.log(err.responseText);
        },
    });
};

///////////// edit violation amount popup /////////////
ExternalViolationLog.editExternalViolationAmountPopup = (
    TaskID,
    ViolationID,
    violationCode,
    caseNumber,
    currentAmount
) => {
    $(".overlay").removeClass("active");

    let popupTitle = violationCode
        ? `تعديل مبلغ السداد - المخالفة رقم (${violationCode})`
        : `تعديل مبلغ السداد`;

    let popupHtml = `
        <div class="popupHeader" style="display: flex; justify-content: space-between;">
            <div class="violationsCode"> 
                <p>${popupTitle}</p>
            </div>
            <div class="btnStyle cancelBtn popupBtn closeEditAmountPopup" id="closeEditAmountPopup" style="color: #fff; cursor: pointer;" data-dismiss="modal" aria-label="Close">
                <i class="fa-solid fa-x"></i>
            </div>
        </div>
        <div class="popupBody">
            <div class="popupForm detailsPopupForm" id="detailsPopupForm">

                <div class="formContent">
                    <div class="formBox">
                        <div class="formElements">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="currentAmount" class="customLabel">المبلغ الحالي</label>
                                        <input class="form-control disabled customInput currentAmount" id="currentAmount" type="text" value="${functions.splitBigNumbersByComma(currentAmount > 0 ? currentAmount : 0)}" disabled>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="newAmount" class="customLabel">المبلغ الجديد</label>
                                        <input class="form-control customInput newAmount" id="newAmount" type="text" placeholder="أدخل المبلغ الجديد">
                                    </div>
                                </div>
                                <div class="col-md-12">
                                    <div class="form-group customFormGroup">
                                        <label for="amountComments" class="customLabel">ملاحظات</label>
                                        <textarea class="form-control customTextArea amountComments" id="amountComments" rows="3" placeholder="أدخل الملاحظات"></textarea>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="form-group customFormGroup">
                                        <label for="editAmountAttach" class="customLabel">إرفاق مستند تعديل المبلغ</label>
                                        <div class="fileBox" id="dropContainer">
                                            <div class="inputFileBox">
                                                <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                                <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                                <input type="file" class="customInput attachFilesInput editAmountAttach form-control" id="editAmountAttach" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx" multiple>
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
                            <div class="buttonsBox centerButtonsBox">
                                <div class="btnStyle confirmBtnGreen popupBtn confirmEditAmountBtn" id="confirmEditAmountBtn">تأكيد</div>
                                <div class="btnStyle cancelBtn popupBtn closeEditAmountPopupFooter" id="closeEditAmountPopupFooter" data-dismiss="modal" aria-label="Close">إلغاء</div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>`;

    functions.declarePopup(
        ["generalPopupStyle", "greenPopup", "editPopup"],
        popupHtml
    );

    // Add close button handlers
    $("#closeEditAmountPopup, #closeEditAmountPopupFooter").on("click", function () {
        functions.closePopup();
    });

    let filesExtension = [
        "gif", "svg", "jpg", "jpeg", "png",
        "doc", "docx", "pdf", "xls", "xlsx", "pptx"
    ];
    let allAttachments;
    let countOfFiles;
    let NewAmountInput = "";

    // Store old amount
    let OldAmount = currentAmount > 0 ? currentAmount : 0;

    // File attachment handling
    $("#editAmountAttach").on("change", (e) => {
        allAttachments = $(e.currentTarget)[0].files;
        if (allAttachments.length > 0) {
            $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").show().empty();
        }
        for (let i = 0; i < allAttachments.length; i++) {
            $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").append(`
                <div class="file">
                    <p class="fileName">${allAttachments[i].name}</p>
                    <span class="deleteFile" data-index="${i}"><i class="fa-sharp fa-solid fa-x"></i></span>
                </div>
            `);
        }

        $(".deleteFile").on("click", (event) => {
            let index = $(event.currentTarget).closest(".file").index();
            $(event.currentTarget).closest(".file").remove();
            let fileBuffer = new DataTransfer();
            for (let i = 0; i < allAttachments.length; i++) {
                if (index !== i) {
                    fileBuffer.items.add(allAttachments[i]);
                }
            }
            allAttachments = fileBuffer.files;
            countOfFiles = allAttachments.length;
            if (countOfFiles == 0) {
                $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
            }
        });

        for (let i = 0; i < allAttachments.length; i++) {
            let fileSplited = allAttachments[i].name.split(".");
            let fileExt = fileSplited[fileSplited.length - 1].toLowerCase();
            if ($.inArray(fileExt, filesExtension) == -1) {
                functions.warningAlert("من فضلك أدخل الملفات بالامتدادات المسموح بها فقط");
                $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
                $(e.currentTarget).val("");
            }
        }
    });

    // Format amount input
    $("#newAmount").on("keypress", (e) => {
        return functions.isDecimalNumberKey(e);
    });

    $("#newAmount").on("input", (e) => {
        let rawValue = $(e.currentTarget).val().replace(/\,/g, "");
        rawValue = rawValue.replace(/[^0-9.]/g, '');
        NewAmountInput = rawValue;

        if (rawValue) {
            let formatted = rawValue.replace(/\B(?=(?:\d{3})+(?!\d))/g, ",");
            $(e.currentTarget).val(formatted);
        }
    });

    // Confirm button handler
    $("#confirmEditAmountBtn").on("click", (e) => {
        let cleanAmount = NewAmountInput.replace(/\,/g, "");

        if (cleanAmount != "" && !isNaN(parseFloat(cleanAmount)) && parseFloat(cleanAmount) > 0) {
            if (allAttachments != null && allAttachments.length > 0) {
                let comments = $("#amountComments").val().trim();

                $(".overlay").addClass("active");

                // Update the task with new amount
                ExternalViolationLog.updateExternalViolationAmount(
                    TaskID,
                    ViolationID,
                    parseFloat(cleanAmount),
                    parseFloat(OldAmount),
                    comments,
                    "#editAmountAttach"
                );
            } else {
                functions.warningAlert("من فضلك قم بإرفاق مستند تعديل المبلغ");
            }
        } else {
            functions.warningAlert("من فضلك قم بإدخال المبلغ الجديد بشكل صحيح");
        }
    });
};

ExternalViolationLog.updateExternalViolationAmount = (
    TaskID,
    ViolationID,
    newAmount,
    oldAmount,
    comments,
    attachInput
) => {
    let request = {
        request: {
            Data: {
                ID: TaskID,
                ViolationId: ViolationID,
                TotalPriceDue: newAmount,
                TotalOldPrice: oldAmount,
                Comment: comments,
                Title: "تم تعديل مبلغ السداد"
            }
        }
    };

    functions
        .requester(
            "/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Save",
            request
        )
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
        })
        .then((data) => {
            if (data.d && data.d.Status) {
                // Upload attachment after successful update
                ExternalViolationLog.uploadAmountEditAttachment(
                    ViolationID,
                    attachInput,
                    "تم تعديل مبلغ السداد بنجاح"
                );
            } else {
                $(".overlay").removeClass("active");
                functions.warningAlert("حدث خطأ أثناء تعديل المبلغ");
            }
        })
        .catch((err) => {
            console.error("Error updating amount:", err);
            $(".overlay").removeClass("active");
            functions.warningAlert("حدث خطأ أثناء تعديل المبلغ");
        });
};
ExternalViolationLog.uploadAmountEditAttachment = (
    ViolationID,
    attachInput,
    successMessage
) => {
    let Data = new FormData();
    Data.append("itemId", ViolationID);
    Data.append("listName", "Violations");

    let filesInput = $(attachInput)[0];
    for (let i = 0; i <= filesInput.files.length; i++) {
        Data.append("file" + i, filesInput.files[i]);
    }

    $.ajax({
        type: "POST",
        url: "/_layouts/15/Uranium.Violations.SharePoint/Attachments.aspx/Upload",
        processData: false,
        contentType: false,
        data: Data,
        success: (data) => {
            $(".overlay").removeClass("active");
            functions.sucessAlert(successMessage);
            functions.closePopup();
        },
        error: (err) => {
            $(".overlay").removeClass("active");
            functions.warningAlert("تم تعديل المبلغ ولكن حدث خطأ في رفع المرفقات");
            console.log(err.responseText);
        },
    });
};
////////////////////////////////


// ===============================
//  Violation History Tracking for External Violations
// ===============================
const ViolationHistoryLogsExternal = () => {
    let selectedViolationId = null;
    let selectedViolationCode = null;
    let trackHistoryTable = null;

    // ===============================
    //  Open Modal
    // ===============================
    $(document).on("click", ".violationHistoryExternal", function (e) {
        e.preventDefault();
        e.stopPropagation();

        selectedViolationId = $(this).data("violationid");
        selectedViolationCode = $(this).data("violationcode");

        $("#trackHistoryModalExternal").modal("show");
    });

    // ===============================
    //  Close Modal Handlers
    // ===============================
    const closeModal = () => {
        $("#trackHistoryModalExternal").modal("hide");

        // Clear the modal content
        $(".track-history-violation-code").text("");

        if (trackHistoryTable) {
            trackHistoryTable.clear().destroy();
            trackHistoryTable = null;
        }

        $("#trackHistoryTableExternal tbody").empty();
    };

    // Close button in header
    $(document).on("click", "#closeViolationHistoryPopupExternal", function (e) {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
    });

    // Bootstrap modal hide event
    $("#trackHistoryModalExternal").on("hidden.bs.modal", function () {
        closeModal();
    });

    // ===============================
    //  When Modal Opens
    // ===============================
    $("#trackHistoryModalExternal").on("shown.bs.modal", function () {
        $(".track-history-violation-code").text(selectedViolationCode);

        const request = {
            Request: {
                ViolationId: selectedViolationId,
            },
        };

        const tableElement = $("#trackHistoryTableExternal");

        // Initialize DataTable
        if (!trackHistoryTable) {
            trackHistoryTable = tableElement.DataTable({
                processing: true,
                paging: false,
                responsive: true,
                destroy: true,

                ajax: {
                    url: "/_layouts/15/Uranium.Violations.SharePoint/ViolationHistoryLogs.aspx/Search",
                    type: "POST",
                    contentType: "application/json",
                    data: () => JSON.stringify(request),

                    dataSrc: (data) => {
                        return data?.d?.Result?.GridData || [];
                    }
                },

                columns: [
                    {
                        data: null,
                        render: (data, type, row, meta) => {
                            return meta.row + 1;
                        }
                    },
                    {
                        data: "Status",
                        render: (data) => {
                            // Translate status to Arabic
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
                                "UnderReview": "منظورة",
                                "ExternalReviewed": "منظورة",
                                "Completed": "مكتملة",
                                "Cancelled": "ملغاه"
                            };
                            return statusMap[data] || data || "-";
                        }
                    },
                    {
                        data: "Created",
                        render: (data) =>
                            data ? functions.getFormatedDate(data) : "-"
                    },
                    {
                        data: "CreatedBy",
                        render: (data) => {
                            return data || "-";
                        }
                    },
                    {
                        data: "Comment",
                        render: (data) => {
                            return data || "-";
                        }
                    }
                ],

                language: {
                    emptyTable: "لا توجد بيانات",
                }
            });

        } else {
            // Reload data
            trackHistoryTable.ajax.reload();
        }
    });

    // ===============================
    //  When Modal Closes
    // ===============================
    $("#trackHistoryModalExternal").on("hidden.bs.modal", function () {
        $(".track-history-violation-code").text("");

        if (trackHistoryTable) {
            trackHistoryTable.clear().destroy();
            trackHistoryTable = null;
        }

        $("#trackHistoryTableExternal tbody").empty();
    });
};

// Initialize the history tracking
ViolationHistoryLogsExternal();




export default ExternalViolationLog;






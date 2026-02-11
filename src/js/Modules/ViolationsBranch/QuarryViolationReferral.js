import functions from "../../Shared/functions";
import DetailsPopup from "../../Shared/detailsPopupContent";
import confirmPopup from "../../Shared/confirmationPopup";
import pagination from "../../Shared/Pagination";

let quarryViolationReferral = {
    dataObj: {
        destroyTable: false,
    },
    pageIndex: 1
};

quarryViolationReferral.getQuarryViolationReferrals = (
    pageIndex = 1,
    destroyTable = false,
    ReferralNumber = "",
    CaseStatus = "",
    OffenderType = "Quarry",
    RefferedDateFrom = "",
    RefferedDateTo = ""
) => {
    let request = {
        Request: {
            RowsPerPage: pagination.rowsPerPage || 10,
            PageIndex: pageIndex,
            ColName: "created",
            SortOrder: "desc",
            ReferralNumber: ReferralNumber,
            Status: CaseStatus,
            OffenderType: OffenderType,
            RefferedDateFrom: RefferedDateFrom
                ? moment(RefferedDateFrom, "DD-MM-YYYY").format("YYYY-MM-DD")
                : "",
            RefferedDateTo: RefferedDateTo
                ? moment(RefferedDateTo, "DD-MM-YYYY").format("YYYY-MM-DD")
                : "",
        }
    };

    Object.keys(request.Request).forEach(key => {
        if (request.Request[key] === "") {
            delete request.Request[key];
        }
    });

    functions
        .requester(
            "/_layouts/15/Uranium.Violations.SharePoint/Cases.aspx/Search",
            request
        )
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
        })
        .then((data) => {
            $(".PreLoader").removeClass("active");
            let Referrals = [];
            let ItemsData = data?.d?.Result;

            if (data?.d?.Result?.GridData != null) {
                if (data.d.Result.GridData.length > 0) {
                    Array.from(data.d.Result.GridData).forEach((element) => {
                        Referrals.push(element);
                    });
                } else {
                    Referrals = [];
                }
            }

            const totalPages = ItemsData?.TotalPageCount || 0;
            const rowsPerPage = ItemsData?.RowsPerPage || pagination.rowsPerPage || 10;
            const currentPage = ItemsData?.CurrentPage || pageIndex;

            quarryViolationReferral.setPaginations(totalPages, rowsPerPage);
            quarryViolationReferral.QuarryViolationReferralTable(
                Referrals,
                destroyTable || quarryViolationReferral.dataObj.destroyTable
            );
            quarryViolationReferral.pageIndex = currentPage;
        })
        .catch((err) => {
            console.error("API Error:", err);
            $(".PreLoader").removeClass("active");
            functions.warningAlert("حدث خطأ في تحميل البيانات");
        });
};

quarryViolationReferral.setPaginations = (TotalPages, RowsPerPage) => {
    pagination.draw("#paginationID", TotalPages, RowsPerPage);
    pagination.start("#paginationID", quarryViolationReferral.getQuarryViolationReferrals);
    pagination.activateCurrentPage();
};

quarryViolationReferral.resetFilter = (e) => {
    e.preventDefault();

    // Clear all filter inputs
    $("#CaseNumber").val("");
    $("#CaseStatus").val(""); // This will reset to the first option
    $("#RefferedDateFrom").val("");
    $("#RefferedDateTo").val("");

    // If you want to set CaseStatus to "قيد انتظار تأشيرات النيابة" as default instead of empty
    // $("#CaseStatus").val("قيد انتظار تأشيرات النيابة");

    $(".PreLoader").addClass("active");
    pagination.reset();
    quarryViolationReferral.dataObj.destroyTable = true;
    quarryViolationReferral.getQuarryViolationReferrals(1, true);
};

quarryViolationReferral.QuarryViolationReferralTable = (Referrals, destroyTable = false) => {
    let data = [];
    console.log('Referrals', Referrals)

    if (Referrals && Referrals.length > 0) {
        Referrals.forEach((referral) => {
            let violation = referral?.Violation;
            let refferedDate = functions.getFormatedDate(referral.RefferedDate);
            let violationStatus = referral.ViolationStatus || "";
            let caseStatus = referral.Status || "";
            let referralNumber = referral.ReferralNumber || "";
            let caseNumber = referral.CaseNumber || "";
            let ReferredAmount = violation.ReferredAmount || 0;

            // Determine which actions to show based on business rules
            let hasAddReferralNumberAction = false;
            let hasEditAmountAction = false;
            let hasPayCaseBeforeEditAction = false; // سداد على نموذج التقييم
            let hasPayCaseAfterEditAction = false;  // سداد على الإحالة
            let hasSaveCaseAction = false; // NEW: حفظ القضية
            let canShowDetailsOnly = false;

            // Business Rule 1: Add Referral Number
            if (!referralNumber &&
                caseStatus == "قيد انتظار رقم الإحالة" &&
                violationStatus == "UnderReview") {
                hasAddReferralNumberAction = true;
            }

            // Business Rule 2: Edit Amount
            if (referralNumber &&
                ReferredAmount <= 0 &&
                caseStatus == "تم التسليم للتحريات" &&
                violationStatus == "UnderReview") {
                hasEditAmountAction = true;
            }

            // Business Rule 3: Pay Case Before Edit (سداد على نموذج التقييم)
            if (referralNumber &&
                ReferredAmount <= 0 &&
                caseStatus == "قيد انتظار تأشيرات النيابة" &&
                violationStatus == "UnderReview") {
                hasPayCaseBeforeEditAction = true;
            }

            // Business Rule 4: Pay Case After Edit (سداد على الإحالة)
            if (referralNumber &&
                ReferredAmount > 0 &&
                caseStatus == "تم التسليم للتحريات" &&
                violationStatus == "UnderReview") {
                hasPayCaseAfterEditAction = true;
            }

            // NEW Business Rule 5: Save Case - based on your requirements
            if (violationStatus !== "Paid" && // Violation status is not "Paid"
                (caseStatus === "قيد انتظار رقم الإحالة" || 
                 caseStatus === "قيد انتظار تأشيرات النيابة" || 
                 caseStatus === "تم التسليم للتحريات")) {
                hasSaveCaseAction = true;
            }

            // Business Rule 6: Paid - show details only
            if (violationStatus == "Paid") {
                canShowDetailsOnly = true;
            }

            // Build actions menu HTML
            let actionsMenuHTML = '';
            if (canShowDetailsOnly) {
                actionsMenuHTML = `
                <ul class='list-unstyled controlsList'>
                    <li><a href="#" class="itemDetails">المزيد من التفاصيل</a></li>
                </ul>`;
            } else {
                actionsMenuHTML = `
                <ul class='list-unstyled controlsList'>
                    <li><a href="#" class="itemDetails">المزيد من التفاصيل</a></li>`;

                // Add Save Case Action (NEW)
                if (hasSaveCaseAction) {
                    actionsMenuHTML += `
                    <li><a href="#" class="saveCaseAction"
                           data-referralid="${referral.ID}"
                           data-violationid="${referral.ViolationId}"
                           data-taskid="${referral.TaskId}"
                           data-referralnumber="${referral.ReferralNumber || ''}"
                           data-violationcode="${referral.ViolationCode}"
                           data-casestatus="${caseStatus}">حفظ</a></li>`;
                }

                if (hasAddReferralNumberAction) {
                    actionsMenuHTML += `
                    <li><a href="#" class="addReferralNumberAction" 
                           data-referralid="${referral.ID}"
                           data-violationid="${referral.ViolationId}"
                           data-taskid="${referral.TaskId}"
                           data-violationcode="${referral.ViolationCode}">إضافة رقم الإحالة</a></li>`;
                }

                if (hasEditAmountAction) {
                    actionsMenuHTML += `
                    <li><a href="#" class="editAmountAction"
                           data-referralid="${referral.ID}"
                           data-violationid="${referral.ViolationId}"
                           data-taskid="${referral.TaskId}"
                           data-totaloldprice="${violation?.TotalPriceDue || 0}"
                           data-referralnumber="${referral.ReferralNumber || ''}">تعديل مبلغ الإحالة</a></li>`;
                }

                if (hasPayCaseBeforeEditAction) {
                    actionsMenuHTML += `
                    <li><a href="#" class="payCaseBeforeEditAction"
                           data-referralid="${referral.ID}"
                           data-violationid="${violation?.ID}"
                           data-taskid="${referral.TaskId}"
                           data-referralnumber="${referral.ReferralNumber || ''}"
                           data-violationcode="${referral.ViolationCode}"
                           data-totalprice="${violation?.TotalPriceDue || 0}"
                           data-oldprice="${violation?.TotalOldPrice || 0}">سداد على نموذج التقييم</a></li>`;
                }

                if (hasPayCaseAfterEditAction) {
                    actionsMenuHTML += `
                    <li><a href="#" class="payCaseAfterEditAction"
                           data-referralid="${referral.ID}"
                           data-violationid="${violation?.ID}"
                           data-taskid="${referral.TaskId}"
                           data-referralnumber="${referral.ReferralNumber || ''}"
                           data-violationcode="${referral.ViolationCode}"
                           data-totalprice="${violation?.TotalPriceDue || 0}"
                           data-referredamount="${ReferredAmount}"
                           data-oldprice="${violation?.TotalOldPrice || 0}">سداد على الإحالة</a></li>`;
                }

                actionsMenuHTML += `</ul>`;
            }

            let displayViolationStatus = quarryViolationReferral.getViolationStatus(violationStatus);
            // let displayCaseStatus = quarryViolationReferral.getCaseStatus(caseStatus); // Use the new function
            // `<div class="referralStatus">${displayCaseStatus || "-----"}</div>`, // Updated this line

            data.push([
                `<div class="violationCode noWrapContent" 
                        data-referralid="${referral.ID}" 
                        data-violationid="${referral.ViolationId}" 
                        data-taskid="${referral.TaskId}" 
                        data-referralstatus="${referral.Status}" 
                        data-referralnumber="${referral.ReferralNumber}" 
                        data-violationcode="${referral.ViolationCode}" 
                        data-oldprice="${violation?.TotalOldPrice}" 
                        data-newprice="${violation?.TotalPriceDue}"
                        data-referredamount="${ReferredAmount}"
                        data-offendertype="${violation?.OffenderType}"
                        data-casenumber="${caseNumber}"
                        data-violationstatus="${violationStatus}">
                        ${referral.ViolationCode}
                </div>`,
                `<div class='controls'>
                    <div class='ellipsisButton'>
                        <i class='fa-solid fa-ellipsis-vertical'></i>
                    </div>
                    <div class="hiddenListBox">
                        <div class='arrow'></div>
                        ${actionsMenuHTML}
                    </div>
                </div>`,
                `<div class="refferedDate noWrapContent">${refferedDate}</div>`,
                `<div class="referralNumber">${referralNumber || "-----"}</div>`,
                `<div class="violationStatus">${displayViolationStatus || "-----"}</div>`,
                `<div class="referralStatus">${caseStatus || "-----"}</div>`,
                `<div class="referralAttachments caseAttachments"><a href="#!" style="color: black;">المرفقات</a></div>`,
            ]);
        });
    } else {
        data.push([
            `<div class="no-data">لا توجد بيانات متاحة</div>`,
            "",
            "",
            "",
            "",
            "",
            ""
        ]);
    }

    let Table = functions.tableDeclare(
        "#QuarryViolationReferralTable",
        data,
        [
            { title: "رقم المخالفة" },
            { title: "", class: "all" },
            { title: "تاريخ الإحالة" },
            { title: "رقم الإحالة" },
            { title: "حالة المخالفة" },
            { title: "موقف الإحالة" },
            { title: "المرفقات" },
        ],
        false,
        destroyTable,
        "سجل إحالات المخالفات المحجرية.xlsx",
        "سجل إحالات المخالفات المحجرية"
    );

    if (destroyTable && $.fn.DataTable.isDataTable("#QuarryViolationReferralTable")) {
        $("#QuarryViolationReferralTable").DataTable().destroy();
    }

    // Event handlers
    $(document).off('click', '.ellipsisButton').on('click', '.ellipsisButton', function (e) {
        e.stopPropagation();
        $(".hiddenListBox").hide(300);
        $(this).siblings(".hiddenListBox").toggle(300);
    });

    $(document).on('click', function (e) {
        if (!$(e.target).closest('.controls').length) {
            $(".hiddenListBox").hide(300);
        }
    });

    let referralsLog = Table.rows().nodes().to$();
    quarryViolationReferral.dataObj.destroyTable = true;

    referralsLog.each(function (index) {
        let jQueryRecord = $(this);

        if (jQueryRecord.find(".no-data").length === 0) {
            let referralID = jQueryRecord.find(".violationCode").data("referralid");
            let referralNumber = jQueryRecord.find(".violationCode").data("referralnumber");
            let hiddenListBox = jQueryRecord.find(".controls").children(".hiddenListBox");

            // Attachments click handler - USING SAME STRUCTURE AS violationsCases
            jQueryRecord.find(".referralAttachments").find("a").off('click').on('click', function (e) {
                e.preventDefault();
                $(".overlay").addClass("active");
                quarryViolationReferral.getReferralAttachmentsByReferralId(referralID, referralNumber);
            });

            // Details click handler
            jQueryRecord.find(".itemDetails").off('click').on('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                $(".overlay").addClass("active");
                quarryViolationReferral.FindReferralById(referralID);
                $(".hiddenListBox").hide(300);
            });

            // Position dropdown if needed
            if (referralsLog.length > 3 && hiddenListBox.height() > 110 &&
                jQueryRecord.is(":nth-last-child(-n + 4)")) {
                hiddenListBox.addClass("toTopDDL");
            }
        }
    });

    // Add Referral Number Action - MATCHING violationsCases STRUCTURE
    $(document).off('click', '.addReferralNumberAction').on('click', '.addReferralNumberAction', function (e) {
        e.preventDefault();
        e.stopPropagation();

        let referralId = $(this).data('referralid');
        let violationId = $(this).data('violationid');
        let taskId = $(this).data('taskid');
        let violationCode = $(this).data('violationcode');

        console.log('Add Referral Action:', { referralId, violationId, taskId, violationCode });

        // Show popup similar to violationsCases.addCaseNumberPopup
        quarryViolationReferral.addReferralNumberPopup(referralId, violationId, violationCode, taskId);

        $(".hiddenListBox").hide(300);
    });

    // Edit Amount Action - MATCHING violationsCases STRUCTURE
    $(document).off('click', '.editAmountAction').on('click', '.editAmountAction', function (e) {
        e.preventDefault();
        e.stopPropagation();

        let referralId = $(this).data('referralid');
        let violationId = $(this).data('violationid');
        let taskId = $(this).data('taskid');
        let totalOldPrice = $(this).data('totaloldprice');
        let referralNumber = $(this).data('referralnumber');

        // Show popup similar to violationsCases.editCasePrice
        quarryViolationReferral.editReferralAmountPopup(referralId, violationId, taskId, referralNumber, totalOldPrice);

        $(".hiddenListBox").hide(300);
    });

    // Pay Case Before Edit Action (سداد على نموذج التقييم)
    $(document).off('click', '.payCaseBeforeEditAction').on('click', '.payCaseBeforeEditAction', function (e) {
        e.preventDefault();
        e.stopPropagation();

        let referralId = $(this).data('referralid');
        let violationId = $(this).data('violationid');
        let taskId = $(this).data('taskid');
        let referralNumber = $(this).data('referralnumber');
        let violationCode = $(this).data('violationcode');
        let totalPrice = $(this).data('totalprice');
        let oldPrice = $(this).data('oldprice');

        console.log('Pay Case Before Edit:', {
            referralId,
            violationId,
            taskId,
            referralNumber,
            violationCode,
            totalPrice,
            oldPrice
        });

        quarryViolationReferral.payCaseBeforeEditPopup(
            referralId,
            violationId,
            taskId,
            referralNumber,
            violationCode,
            totalPrice
        );

        $(".hiddenListBox").hide(300);
    });

    // Pay Case After Edit Action (سداد على الإحالة)
    $(document).off('click', '.payCaseAfterEditAction').on('click', '.payCaseAfterEditAction', function (e) {
        e.preventDefault();
        e.stopPropagation();

        let referralId = $(this).data('referralid');
        let violationId = $(this).data('violationid');
        let taskId = $(this).data('taskid');
        let referralNumber = $(this).data('referralnumber');
        let violationCode = $(this).data('violationcode');
        let totalPrice = $(this).data('totalprice');
        let oldPrice = $(this).data('oldprice');
        let referredAmount = $(this).data('referredamount');

        console.log('Pay Case After Edit:', {
            referralId,
            violationId,
            taskId,
            referralNumber,
            violationCode,
            totalPrice,
            oldPrice,
            referredAmount
        });

        quarryViolationReferral.payCaseAfterEditPopup(
            referralId,
            violationId,
            taskId,
            referralNumber,
            violationCode,
            totalPrice,
            oldPrice,
            referredAmount
        );

        $(".hiddenListBox").hide(300);
    });

    $(document).on('click', '.controlsList a', function (e) {
        $(this).closest('.hiddenListBox').hide(300);
    });

    functions.hideTargetElement(".controls", ".hiddenListBox");
};

quarryViolationReferral.addReferralNumberPopup = (ReferralID, ViolationID, ViolationCode, TaskID) => {
    $(".overlay").removeClass("active");
    let popupHtml = `
        <div class="popupHeader">
            <div class="violationsCode"> 
                <p>إضافة رقم الإحالة للمخالفة رقم (${ViolationCode})</p>
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
                                        <label for="referralNumber" class="customLabel">رقم الإحالة</label>
                                        <input class="form-control customInput referralNumber" id="referralNumber" type="text" placeholder="أدخل رقم الإحالة">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="referralComments" class="customLabel">ملاحظات</label>
                                        <textarea class="form-control customTextArea referralComments" id="referralComments" rows="3" placeholder="أدخل الملاحظات"></textarea>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="form-group customFormGroup">
                                        <label for="referralNumberAttach" class="customLabel">إرفاق مستند رقم الإحالة</label>
                                        <div class="fileBox" id="dropContainer">
                                            <div class="inputFileBox">
                                                <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                                <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                                <input type="file" class="customInput attachFilesInput referralNumberAttach form-control" id="referralNumberAttach" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx" multiple>
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
                                <div class="btnStyle confirmBtnGreen popupBtn AddReferralNumberBtn" id="AddReferralNumberBtn">تأكيد</div>
                                <div class="btnStyle cancelBtn popupBtn closeReferralNumberPopup" id="closeReferralNumberPopup" data-dismiss="modal" aria-label="Close">إلغاء</div>
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

    let ReferralNumberInput = $("#referralNumber").val();
    let ReferralCommentsInput = $("#referralComments").val();
    let filesExtension = [
        "gif", "svg", "jpg", "jpeg", "png",
        "doc", "docx", "pdf", "xls", "xlsx", "pptx"
    ];
    let allAttachments;
    let countOfFiles;
    let request = {};

    // File attachment handling - SAME AS violationsCases
    $("#referralNumberAttach").on("change", (e) => {
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

    $("#referralNumber").on("keyup", (e) => {
        ReferralNumberInput = $(e.currentTarget).val().trim();
    });

    $("#referralComments").on("keyup", (e) => {
        ReferralCommentsInput = $(e.currentTarget).val().trim();
    });

    $(".AddReferralNumberBtn").on("click", (e) => {
        if (ReferralNumberInput != "") {
            if (allAttachments != null && allAttachments.length > 0) {
                request = {
                    Request: {
                        Title: "تم إضافة رقم الإحالة",
                        Comments: ReferralCommentsInput,
                        Status: "قيد الانتظار القطاع",
                        ViolationId: ViolationID,
                        ReferralNumber: ReferralNumberInput,
                        TaskId: TaskID,
                        ID: ReferralID
                    },
                };
                $(".overlay").addClass("active");
                quarryViolationReferral.editReferralAPIResponse(
                    request,
                    ReferralID,
                    "إضافة رقم الإحالة",
                    "#referralNumberAttach",
                    "تم إضافة رقم الإحالة"
                );
            } else {
                functions.warningAlert("من فضلك قم بإرفاق المستند المرفق به رقم الإحالة");
            }
        } else {
            functions.warningAlert("من فضلك قم بإضافة رقم الإحالة بشكل صحيح");
        }
    });
};

quarryViolationReferral.editReferralAmountPopup = (
    ReferralID,
    ViolationID,
    TaskID,
    referralNumber,
    oldPrice,
) => {
    $(".overlay").removeClass("active");
    let popupHtml = `
        <div class="popupHeader">
            <div class="violationsCode"> 
                <p>تعديل مبلغ الإحالة رقم (${referralNumber})</p>
            </div>
        </div> 
        <div class="popupBody">
            <div class="popupForm detailsPopupForm" id="detailsPopupForm">

                <div class="formContent"> 
                    <div class="formBox">
                        <div class="formElements">
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="form-group customFormGroup">
                                        <label for="oldViolationPrice" class="customLabel">المبلغ القديم</label>
                                        <input class="form-control disabled customInput oldViolationPrice" id="oldViolationPrice" type="text" value="${functions.splitBigNumbersByComma(oldPrice)}" disabled>
                                    </div> 
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group customFormGroup">
                                        <label for="referredAmount" class="customLabel">غرامة التسليم للتحريات</label>
                                        <input class="form-control customInput referredAmount" id="referredAmount" type="text" placeholder="أدخل قيمة الغرامة">
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group customFormGroup">
                                        <label for="newTotalAmount" class="customLabel">المبلغ الكلي (الإحالة)</label>
                                        <input class="form-control customInput newTotalAmount" id="newTotalAmount" type="text" placeholder="سيتم حسابه تلقائياً" disabled>
                                    </div>
                                </div>
                                <div class="col-md-12">
                                    <div class="form-group customFormGroup">
                                        <label for="amountComments" class="customLabel">ملاحظات</label>
                                        <textarea class="form-control customTextArea amountComments" id="amountComments" placeholder="أدخل الملاحظات"></textarea>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="form-group customFormGroup">
                                        <label for="editReferralAmountAttach" class="customLabel">إرفاق مستند إعادة التقييم</label>
                                        <div class="fileBox" id="dropContainer">
                                            <div class="inputFileBox">
                                                <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                                <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                                <input type="file" class="customInput attachFilesInput editReferralAmountAttach form-control" id="editReferralAmountAttach" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx" multiple>
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
                                <div class="btnStyle confirmBtnGreen popupBtn editReferralAmountBtn" id="editReferralAmountBtn">تعديل</div>
                                <div class="btnStyle cancelBtn popupBtn closeReferralAmountPopup" id="closeReferralAmountPopup" data-dismiss="modal" aria-label="Close">إلغاء</div>
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

    // Remove commas from oldPrice to get the actual numeric value
    let OldViolationPrice = oldPrice.toString().replace(/\,/g, "");
    let ReferredAmountInput = "";
    let NewTotalAmountInput = "";
    let AmountCommentsInput = "";
    let filesExtension = [
        "gif", "svg", "jpg", "jpeg", "png",
        "doc", "docx", "pdf", "xls", "xlsx", "pptx"
    ];
    let allAttachments;
    let countOfFiles;
    let PositiveDecimalNumbers = /^[+]?([0-9]+(?:[\.][0-9]*)?|\.[0-9]+)$/;
    let request = {};

    // File attachment handling - SAME AS violationsCases
    $("#editReferralAmountAttach").on("change", (e) => {
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

    // Calculate total when referred amount changes
    $("#referredAmount").on("keypress", (e) => {
        return functions.isDecimalNumberKey(e);
    });

    $("#referredAmount").on("keyup", (e) => {
        // Remove commas for calculation, then add them back for display
        let rawValue = $(e.currentTarget).val().replace(/\,/g, "");
        ReferredAmountInput = rawValue;

        // Format for display
        $(e.currentTarget).val(
            rawValue.replace(/\B(?=(?:\d{3})+(?!\d))/g, ",")
        );

        // Calculate new total
        let oldAmount = parseFloat(OldViolationPrice) || 0;
        let referredAmount = parseFloat(ReferredAmountInput) || 0;
        let newTotal = oldAmount + referredAmount;

        // Update total field
        let formattedTotal = functions.splitBigNumbersByComma(newTotal.toString());
        $("#newTotalAmount").val(formattedTotal);
        NewTotalAmountInput = newTotal.toString();
    });

    $("#amountComments").on("keyup", (e) => {
        AmountCommentsInput = $(e.currentTarget).val().trim();
    });

    $("#editReferralAmountBtn").on("click", (e) => {
        // Remove any commas from input before validation
        let cleanReferredAmount = ReferredAmountInput.replace(/\,/g, "");

        if (cleanReferredAmount != "" && PositiveDecimalNumbers.test(cleanReferredAmount)) {
            if (allAttachments != null && allAttachments.length > 0) {
                request = {
                    Request: {
                        Title: "تم تعديل مبلغ الإحالة",
                        Comments: AmountCommentsInput,
                        ViolationId: ViolationID,
                        ID: ReferralID,
                        TaskId: TaskID,
                        ReferredAmount: parseFloat(cleanReferredAmount),
                        TotalPriceDue: parseFloat(NewTotalAmountInput),
                        TotalOldPrice: parseFloat(OldViolationPrice)
                    },
                };
                console.log("Sending request:", request); // For debugging
                $(".overlay").addClass("active");
                quarryViolationReferral.editReferralAPIResponse(
                    request,
                    ReferralID,
                    "تعديل المبلغ",
                    "#editReferralAmountAttach",
                    "تم تعديل مبلغ الإحالة بناء على إعادة التقييم"
                );
            } else {
                functions.warningAlert("من فضلك قم بإرفاق المستند الخاص بإعادة التقييم");
            }
        } else {
            functions.warningAlert("من فضلك قم بإدخال قيمة غرامة التسليم للتحريات بشكل صحيح");
        }
    });
};
quarryViolationReferral.editReferralAPIResponse = (
    request,
    ReferralId,
    uploadPhase,
    attachInput,
    Message = ""
) => {
    functions
        .requester(
            "/_layouts/15/Uranium.Violations.SharePoint/Cases.aspx/Save",
            request
        )
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
        })
        .then((data) => {
            if (data.d.Status) {
                quarryViolationReferral.addNewReferralAttachmentRecord(
                    ReferralId,
                    uploadPhase,
                    attachInput,
                    Message
                );
            } else {
                functions.warningAlert("هناك خطأ في إرسال بيانات الطلب");
            }
        })
        .catch((err) => {
            console.error(err);
            functions.warningAlert("حدث خطأ في الاتصال بالخادم");
        });
};

quarryViolationReferral.addNewReferralAttachmentRecord = (
    ReferralId,
    uploadPhase,
    attachInput,
    Message = "",
    Comments = ""
) => {
    let request = {
        Request: {
            Title: "New Attachment Record",
            CaseId: ReferralId,
            UploadPhase: uploadPhase,
            Comments: Comments,
        },
    };

    functions
        .requester(
            "/_layouts/15/Uranium.Violations.SharePoint/CaseAttachments.aspx/Save",
            request
        )
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
        })
        .then((data) => {
            if (data.d.Status) {
                let RecordId = data.d.Result.Id;
                quarryViolationReferral.uploadReferralAttachments(
                    RecordId,
                    attachInput,
                    "CasesAttachments",
                    Message
                );
            } else {
                functions.warningAlert("هناك خطأ في إرسال بيانات الطلب");
            }
        })
        .catch((err) => {
            console.error(err);
            functions.warningAlert("حدث خطأ في الاتصال بالخادم");
        });
};

quarryViolationReferral.uploadReferralAttachments = (
    RecordId,
    attachInput,
    ListName,
    Message
) => {
    let Data = new FormData();
    Data.append("itemId", RecordId);
    Data.append("listName", ListName);
    for (let i = 0; i <= $(attachInput)[0].files.length; i++) {
        Data.append("file" + i, $(attachInput)[0].files[i]);
    }

    $.ajax({
        type: "POST",
        url: "/_layouts/15/Uranium.Violations.SharePoint/Attachments.aspx/Upload",
        processData: false,
        contentType: false,
        data: Data,
        success: (data) => {
            $(".overlay").removeClass("active");
            functions.sucessAlert(Message);
            functions.closePopup();
            // Refresh the table
            quarryViolationReferral.getQuarryViolationReferrals(
                quarryViolationReferral.pageIndex,
                true
            );
        },
        error: (err) => {
            functions.warningAlert("خطأ في إرسال البيانات لقاعدة البيانات");
            $(".overlay").removeClass("active");
        },
    });
};

quarryViolationReferral.getReferralAttachmentsByReferralId = (ReferralId, referralNumber) => {
    let request = {
        Request: {
            CaseId: ReferralId,
        }
    };

    functions
        .requester(
            "/_layouts/15/Uranium.Violations.SharePoint/CaseAttachments.aspx/Search",
            request
        )
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
        })
        .then((data) => {
            let ReferralAttachmentsRecords;
            if (data.d.Status) {
                if (data.d.Result.length > 0) {
                    ReferralAttachmentsRecords = data.d.Result;
                } else {
                    ReferralAttachmentsRecords = [];
                }
                quarryViolationReferral.referralAttachmentsDetailsPopup(
                    ReferralId,
                    referralNumber,
                    ReferralAttachmentsRecords
                );
            }
        })
        .catch((err) => {
            console.error(err);
            functions.warningAlert("هناك خطأ في إرسال بيانات الطلب");
        });
};

quarryViolationReferral.referralAttachmentsDetailsPopup = (
    ReferralId,
    referralNumber,
    ReferralAttachmentsRecords
) => {
    let popupHtml = `
        <div class="popupHeader attachPopup">
            <div class="violationsCode"> 
                <p>مرفقات الإحالة رقم (${referralNumber || "-----"})</p>
            </div>
            <div class="btnStyle cancelBtn popupBtn closeReferralAttachPopup" id="closeReferralAttachPopup" style="color: #fff;cursor: pointer;" data-dismiss="modal" aria-label="Close">
                <i class="fa-solid fa-x"></i>
            </div>
        </div> 
        <div class="popupBody">
            <div class="popupTableBox">
                <table id="referralAttachmentsTable" class="table tableWithIcons popupTable"></table>
            </div>
        </div>`;

    functions.declarePopup(
        ["generalPopupStyle", "greenPopup", "editPopup", "attachPopup"],
        popupHtml
    );

    quarryViolationReferral.drawReferralAttachmentsPopupTable(
        "#referralAttachmentsTable",
        ReferralAttachmentsRecords
    );

    // Add close button handler
    $("#closeReferralAttachPopup").on("click", function () {
        functions.closePopup();
    });
};

quarryViolationReferral.drawReferralAttachmentsPopupTable = (
    TableId,
    ReferralAttachmentsRecords
) => {
    $(".overlay").removeClass("active");
    let data = [];
    let counter = 1;

    if (ReferralAttachmentsRecords.length > 0) {
        ReferralAttachmentsRecords.forEach((attchRecord) => {
            let attachedFilesData = attchRecord.Attachments;
            data.push([
                `<div class="attachCount">${counter}</div>`,
                `<div class="attachFiles" data-fileslength="${attachedFilesData.length}">
                    ${quarryViolationReferral.drawAttachmentsInTable(attachedFilesData)}
                </div>`,
                `<div class="attachUploadPhase">${attchRecord.UploadPhase}</div>`,
                `<div class="attachUploadDate">${functions.getFormatedDate(
                    attchRecord.Created,
                    "DD-MM-YYYY hh:mm A"
                )}</div>`,
                `<div class="attachComments">${attchRecord.Comments != ""
                    ? attchRecord.Comments
                    : "----"
                }</div>`,
            ]);
            counter++;
        });
    }

    let Table = functions.tableDeclare(
        TableId,
        data,
        [
            { title: "م", class: "tableCounter" },
            { title: "المرفقات", class: "attachBoxHeader" },
            { title: "سبب الإرفاق" },
            { title: "تاريخ الإرفاق" },
            { title: "ملاحظات" },
        ],
        false,
        false
    );

    let referralAttachmentsLog = Table.rows().nodes().to$();
    $.each(referralAttachmentsLog, (index, record) => {
        let jQueryRecord = $(record);
        let attachFiles = jQueryRecord.find(".attachFiles");
        let attachFilesLength = jQueryRecord.find(".attachFiles").data("fileslength");

        if (attachFilesLength == 1) {
            attachFiles.find(".attchedFile").addClass("singleFile");
        }
        if (attachFilesLength == 2) {
            attachFiles.find(".attchedFile").addClass("multibleFiles");
        }
        if (attachFilesLength >= 3) {
            attachFiles.find(".attchedFile").addClass("manyFiles");
        }
    });
};

quarryViolationReferral.drawAttachmentsInTable = (Attachments) => {
    let attachmentsBox = ``;

    if (Attachments.length > 0) {
        Attachments.forEach((attachment) => {
            attachmentsBox += `
                <a class="attchedFile" target="_blank" href="${attachment.Url}" download="${attachment.Name}" title="${attachment.Name}">
                    <div class="attachDetailsBox">
                        <p class="attchedFileName">${attachment.Name}</p>
                    </div>
                    <span><i class="fa-solid fa-download"></i></span>
                </a>
            `;
        });
    } else {
        attachmentsBox = `<p class="noAttachedFiles">لا يوجد مرفقات</p>`;
    }
    return attachmentsBox;
};

quarryViolationReferral.FindReferralById = (ReferralID, popupType = "") => {
    let request = {
        Id: ReferralID,
    };

    functions
        .requester(
            "/_layouts/15/Uranium.Violations.SharePoint/Cases.aspx/FindById",
            request
        )
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
        })
        .then((data) => {
            let referralData;
            let Content;

            if (data != null) {
                referralData = data.d.Result;
                console.log('referralData', referralData)
                // Fix: Ensure Equipments exists
                if (referralData.Violation && !referralData.Violation.Equipments) {
                    referralData.Violation.Equipments = [];
                }

                // Create a popup with both violation details and referral/case details
                $(".overlay").removeClass("active");

                // Build the popup HTML similar to violationsCases.getCaseDetails
                Content = quarryViolationReferral.getReferralDetails(referralData);

                functions.declarePopup(
                    ["generalPopupStyle", "greenPopup", "caseDetailsPopup"],
                    Content
                );

                // Add print functionality
                $(".printBtn").on("click", (e) => {
                    functions.PrintDetails(e);
                });

                // Add close button functionality
                $(".closeReferralDetailsPopup, .closeDetailsPopup").on("click", function () {
                    functions.closePopup();
                });
            } else {
                referralData = null;
                functions.warningAlert("لا توجد بيانات للإحالة المطلوبة");
            }
        })
        .catch((err) => {
            console.error(err);
            $(".overlay").removeClass("active");
            functions.warningAlert("حدث خطأ في جلب تفاصيل الإحالة");
        });
};

quarryViolationReferral.filterQuarryViolationReferrals = (e) => {
    if (e) e.preventDefault();

    let ReferralNumber = $("#CaseNumber").val() || "";
    let CaseStatus = $("#CaseStatus").children("option:selected").val() || "";
    let RefferedDateFrom = $("#RefferedDateFrom").val() || "";
    let RefferedDateTo = $("#RefferedDateTo").val() || "";

    let OffenderType = "Quarry";

    if (RefferedDateFrom && RefferedDateTo) {
        let fromDate = moment(RefferedDateFrom, "DD-MM-YYYY");
        let toDate = moment(RefferedDateTo, "DD-MM-YYYY");

        if (fromDate.isAfter(toDate)) {
            functions.warningAlert("تاريخ 'من' يجب أن يكون قبل تاريخ 'إلى'");
            return;
        }
    }

    $(".PreLoader").addClass("active");
    quarryViolationReferral.getQuarryViolationReferrals(
        1,
        true,
        ReferralNumber,
        CaseStatus,
        OffenderType,
        RefferedDateFrom,
        RefferedDateTo
    );
};

///////////////////////////////////////////
quarryViolationReferral.getViolationStatus = (ViolationStatus) => {
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
                <span class="statusText">مسددة</span>
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
// quarryViolationReferral.getCaseStatus = (caseStatus) => {
//     let statusHtml = ``;

//     switch (caseStatus) {
//         case "قيد مراجعة النيابة المختصة": {
//             statusHtml = `<div class="statusBox pendingStatus">
//                 <i class="statusIcon fa-regular fa-eye"></i>
//                 <span class="statusText">${caseStatus}</span>
//             </div>`;
//             break;
//         }
//         case "منظورة": {
//             statusHtml = `<div class="statusBox pendingStatus">
//                 <i class="statusIcon fa-regular fa-eye"></i>
//                 <span class="statusText">${caseStatus}</span>
//             </div>`;
//             break;
//         }
//         case "مسددة": {
//             statusHtml = `<div class="statusBox closedStatus">
//                 <i class="statusIcon fa-regular fa-circle-check"></i>
//                 <span class="statusText">${caseStatus}</span>
//             </div>`;
//             break;
//         }
//         case "محفوظة": {
//             statusHtml = `<div class="statusBox savedStatus"> <!-- Added savedStatus class -->
//                 <i class="statusIcon fa-solid fa-box-archive"></i>
//                 <span class="statusText">${caseStatus}</span>
//             </div>`;
//             break;
//         }
//         case "قيد انتظار القطاع": {
//             statusHtml = `<div class="statusBox waitingStatus">
//                 <i class="statusIcon fa-regular fa-clock"></i>
//                 <span class="statusText">${caseStatus}</span>
//             </div>`;
//             break;
//         }
//         case "قيد انتظار رقم القضية": {
//             statusHtml = `<div class="statusBox waitingStatus">
//                 <i class="statusIcon fa-solid fa-hashtag"></i>
//                 <span class="statusText">${caseStatus}</span>
//             </div>`;
//             break;
//         }
//         case "قيد انتظار رقم الإحالة": {
//             statusHtml = `<div class="statusBox waitingStatus">
//                 <i class="statusIcon fa-regular fa-paper-plane"></i>
//                 <span class="statusText">${caseStatus}</span>
//             </div>`;
//             break;
//         }
//         case "قيد انتظار تأشيرات النيابة": {
//             statusHtml = `<div class="statusBox waitingStatus">
//                 <i class="statusIcon fa-solid fa-stamp"></i>
//                 <span class="statusText">${caseStatus}</span>
//             </div>`;
//             break;
//         }
//         case "تم التسليم للتحريات": {
//             statusHtml = `<div class="statusBox deliveredStatus"> <!-- Added deliveredStatus class -->
//                 <i class="statusIcon fa-solid fa-truck-arrow-right"></i>
//                 <span class="statusText">${caseStatus}</span>
//             </div>`;
//             break;
//         }
//         case "قيد انتظار المدعي العام العسكري": {
//             statusHtml = `<div class="statusBox waitingStatus">
//                 <i class="statusIcon fa-solid fa-gavel"></i>
//                 <span class="statusText">${caseStatus}</span>
//             </div>`;
//             break;
//         }
//         case "قيد انتظار الرقم القضائي": {
//             statusHtml = `<div class="statusBox waitingStatus">
//                 <i class="statusIcon fa-solid fa-scale-balanced"></i>
//                 <span class="statusText">${caseStatus}</span>
//             </div>`;
//             break;
//         }
//         case "تم إضافة الرقم القضائي": {
//             statusHtml = `<div class="statusBox completedStatus">
//                 <i class="statusIcon fa-solid fa-check-double"></i>
//                 <span class="statusText">${caseStatus}</span>
//             </div>`;
//             break;
//         }
//         default: {
//             statusHtml = `<div class="statusBox pendingStatus">
//                 <i class="statusIcon fa-regular fa-question-circle"></i>
//                 <span class="statusText">${caseStatus || "---"}</span>
//             </div>`;
//             break;
//         }
//     }

//     return statusHtml;
// };
///////////////////////////////////////////


///////////////////////////////////////////
quarryViolationReferral.getReferralDetails = (referralData) => {
    let violation = referralData.Violation;
    let violationOffenderType = violation?.OffenderType || "Quarry";
    let popupTitle;

    if (referralData.ReferralNumber) {
        popupTitle = `تفاصيل الإحالة رقم (${referralData.ReferralNumber})`;
    } else {
        popupTitle = `تفاصيل الإحالة عن المخالفة رقم (${referralData.ViolationCode})`;
    }

    let popupHtml = `
<div class="caseDetialsPrintBox" id="printJS-form">
    <div class="popupHeader">
        <div class="popupTitleBox">
            <div class="CaseNumberBox">
                <p class="caseNumber">${popupTitle}</p>  
                <div class="printBtn"><img src="/Style Library/MiningViolations/images/WhitePrintBtn.png" alt="Print Button"></div>
            </div>
            <div class="btnStyle cancelBtn popupBtn closeReferralDetailsPopup" id="closeReferralDetailsPopup" style="color: #fff; cursor: pointer;" data-dismiss="modal" aria-label="Close">
                <i class="fa-solid fa-x"></i>
            </div>
        </div> 
    </div>
    <div class="popupBody" style="overflow-y: auto; max-height: 80vh;"> <!-- Added inline styles -->
        <div class="popupForm detailsPopupForm" id="detailsPopupForm">
                <div class="formContent">
                    <div class="formBox">
                        <div class="formBoxHeader">
                            <p class="formBoxTitle"><span class="formNumber">1</span> تفاصيل الإحالة</p>
                        </div>
                        <div class="formElements">
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="form-group customFormGroup">
                                        <label for="referralNumber" class="customLabel">رقم الإحالة</label>
                                        <input class="form-control customInput referralNumber" id="referralNumber" type="text" value="${referralData.ReferralNumber || "----"}" disabled>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group customFormGroup">
                                        <label for="refferedDate" class="customLabel">تاريخ الإحالة</label>
                                        <input class="form-control customInput refferedDate" id="refferedDate" type="text" value="${functions.getFormatedDate(referralData.RefferedDate)}" disabled>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group customFormGroup">
                                        <label for="referralStatus" class="customLabel">حالة الإحالة</label>
                                        <input class="form-control customInput referralStatus" id="referralStatus" type="text" value="${referralData.Status || "----"}" disabled>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group customFormGroup">
                                        <label for="violationStatus" class="customLabel">حالة المخالفة</label>
                                        <input class="form-control customInput violationStatus" id="violationStatus" type="text" value="${quarryViolationReferral.getViolationStatusText(referralData.ViolationStatus)}" disabled>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group customFormGroup">
                                        <label for="caseNumber" class="customLabel">رقم القضية</label>
                                        <input class="form-control customInput caseNumber" id="caseNumber" type="text" value="${referralData.CaseNumber || "----"}" disabled>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group customFormGroup">
                                        <label for="taskId" class="customLabel">رقم المهمة</label>
                                        <input class="form-control customInput taskId" id="taskId" type="text" value="${referralData.TaskId || "----"}" disabled>
                                    </div>
                                </div>
                                <div class="col-md-12">
                                    <div class="form-group customFormGroup">
                                        <label for="comments" class="customLabel">ملاحظات</label>
                                        <textarea class="form-control customTextArea comments" id="comments" disabled>${referralData.Comments || "----"}</textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="formContent">
                    <div class="formBox">
                        <div class="formBoxHeader">
                            <p class="formBoxTitle"><span class="formNumber">2</span> تفاصيل المخالفة</p>
                        </div>
                        <div class="formElements">
                            <div class="row">
                                ${violationOffenderType == "Quarry"
            ? quarryViolationReferral.referralQuarryDetails(violation)
            : violationOffenderType == "Vehicle"
                ? quarryViolationReferral.referralVehicleDetails(violation)
                : quarryViolationReferral.referralEquipmentDetails(violation)
        }
                            </div>
                        </div>
                    </div>
                </div>

                <div class="formButtonsBox">
                    <div class="row">
                        <div class="col-12">
                            <div class="buttonsBox centerButtonsBox ">
                                <div class="btnStyle cancelBtn popupBtn closeDetailsPopup" id="closeDetailsPopup" data-dismiss="modal" aria-label="Close">إغلاق</div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>`;

    return popupHtml;
};
quarryViolationReferral.getViolationStatusText = (status) => {
    const statusMap = {
        "Pending": "قيد الانتظار",
        "Confirmed": "مؤكدة",
        "Exceeded": "تجاوز مدة السداد",
        "Saved": "محفوظة",
        "Paid": "مسددة",
        "Paid After Reffered": "سداد بعد الإحالة",
        "UnderPayment": "قيد السداد",
        "Approved": "تم الموافقة",
        "Rejected": "مرفوضة",
        "Reffered": "تم الإحالة",
        "UnderReview": "منظورة",
        "ExternalReviewed": "خارجية",
        "Completed": "مكتملة",
        "Cancelled": "ملغاه"
    };

    return statusMap[status] || status || "----";
};
quarryViolationReferral.referralQuarryDetails = (violationData) => {
    let detailsHtml = `
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationCode" class="customLabel">رقم المخالفة</label>
                <input class="form-control customInput violationCode" id="violationCode" type="text" value="${violationData.ViolationCode || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violatorName" class="customLabel">اسم المخالف</label>
                <input class="form-control customInput violatorName" id="violatorName" type="text" value="${violationData.ViolatorName || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violatorCompany" class="customLabel">الشركة المخالفة التابع لها</label>
                <input class="form-control customInput violatorCompany" id="violatorCompany" type="text" value="${violationData.ViolatorCompany || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationType" class="customLabel">نوع المخالفة</label>
                <input class="form-control customInput violationType" id="violationType" type="text" value="${violationData.ViolationTypes?.Title || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="materialType" class="customLabel">نوع الخام</label>
                <input class="form-control customInput materialType" id="materialType" type="text" value="${violationData.Material?.Title || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationGov" class="customLabel">المحافظة</label>
                <input class="form-control customInput violationGov" id="violationGov" type="text" value="${violationData.Governrates?.Title || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationZone" class="customLabel">منطقة الضبط</label>
                <input class="form-control customInput violationZone" id="violationZone" type="text" value="${violationData.ViolationsZone || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationDate" class="customLabel">تاريخ الضبط</label>
                <input class="form-control customInput violationDate" id="violationDate" type="text" value="${functions.getFormatedDate(violationData.ViolationDate)}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationTime" class="customLabel">وقت الضبط</label>
                <input class="form-control customInput violationTime" id="violationTime" type="text" value="${functions.getFormatedDate(violationData.ViolationTime, "hh:mm A")}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="totalOldPrice" class="customLabel">المبلغ القديم</label>
                <input class="form-control customInput totalOldPrice" id="totalOldPrice" type="text" value="${functions.splitBigNumbersByComma(violationData.TotalOldPrice || 0)}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="totalPriceDue" class="customLabel">المبلغ المستحق</label>
                <input class="form-control customInput totalPriceDue" id="totalPriceDue" type="text" value="${functions.splitBigNumbersByComma(violationData.TotalPriceDue || 0)}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="quarryCode" class="customLabel">رقم المحجر</label>
                <input class="form-control customInput quarryCode" id="quarryCode" type="text" value="${violationData.QuarryCode || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="quarryType" class="customLabel">نوع المحجر</label>
                <input class="form-control customInput quarryType" id="quarryType" type="text" value="${violationData.QuarryType || "----"}" disabled>
            </div>
        </div>
    `;
    return detailsHtml;
};
quarryViolationReferral.referralVehicleDetails = (violationData) => {
    let detailsHtml = `
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationCode" class="customLabel">رقم المخالفة</label>
                <input class="form-control customInput violationCode" id="violationCode" type="text" value="${violationData.ViolationCode || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violatorName" class="customLabel">اسم المخالف</label>
                <input class="form-control customInput violatorName" id="violatorName" type="text" value="${violationData.ViolatorName || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violatorCompany" class="customLabel">الشركة المخالفة التابع لها</label>
                <input class="form-control customInput violatorCompany" id="violatorCompany" type="text" value="${violationData.ViolatorCompany || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationType" class="customLabel">نوع المخالفة</label>
                <input class="form-control customInput violationType" id="violationType" type="text" value="${violationData.ViolationTypes?.Title || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="materialType" class="customLabel">نوع الخام</label>
                <input class="form-control customInput materialType" id="materialType" type="text" value="${violationData.Material?.Title || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationGov" class="customLabel">المحافظة</label>
                <input class="form-control customInput violationGov" id="violationGov" type="text" value="${violationData.Governrates?.Title || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationZone" class="customLabel">منطقة الضبط</label>
                <input class="form-control customInput violationZone" id="violationZone" type="text" value="${violationData.ViolationsZone || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationDate" class="customLabel">تاريخ الضبط</label>
                <input class="form-control customInput violationDate" id="violationDate" type="text" value="${functions.getFormatedDate(violationData.ViolationDate)}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationTime" class="customLabel">وقت الضبط</label>
                <input class="form-control customInput violationTime" id="violationTime" type="text" value="${functions.getFormatedDate(violationData.ViolationTime, "hh:mm A")}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="totalOldPrice" class="customLabel">المبلغ القديم</label>
                <input class="form-control customInput totalOldPrice" id="totalOldPrice" type="text" value="${functions.splitBigNumbersByComma(violationData.TotalOldPrice || 0)}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="totalPriceDue" class="customLabel">المبلغ المستحق</label>
                <input class="form-control customInput totalPriceDue" id="totalPriceDue" type="text" value="${functions.splitBigNumbersByComma(violationData.TotalPriceDue || 0)}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="carNumber" class="customLabel">رقم العربة</label>
                <input class="form-control customInput carNumber" id="carNumber" type="text" value="${violationData.CarNumber || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="vehicleType" class="customLabel">نوع العربة</label>
                                <input class="form-control customInput vehicleType" id="vehicleType" type="text" value="${violationData.VehicleType || "----"}" disabled>
            </div>
        </div>
    `;
    return detailsHtml;
};
quarryViolationReferral.referralEquipmentDetails = (violationData) => {
    let detailsHtml = `
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationCode" class="customLabel">رقم المخالفة</label>
                <input class="form-control customInput violationCode" id="violationCode" type="text" value="${violationData.ViolationCode || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violatorName" class="customLabel">اسم المخالف</label>
                <input class="form-control customInput violatorName" id="violatorName" type="text" value="${violationData.ViolatorName || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violatorCompany" class="customLabel">الشركة المخالفة التابع لها</label>
                <input class="form-control customInput violatorCompany" id="violatorCompany" type="text" value="${violationData.ViolatorCompany || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationType" class="customLabel">نوع المخالفة</label>
                <input class="form-control customInput violationType" id="violationType" type="text" value="${violationData.ViolationTypes?.Title || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="materialType" class="customLabel">نوع الخام</label>
                <input class="form-control customInput materialType" id="materialType" type="text" value="${violationData.Material?.Title || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationGov" class="customLabel">المحافظة</label>
                <input class="form-control customInput violationGov" id="violationGov" type="text" value="${violationData.Governrates?.Title || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationZone" class="customLabel">منطقة الضبط</label>
                <input class="form-control customInput violationZone" id="violationZone" type="text" value="${violationData.ViolationsZone || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationDate" class="customLabel">تاريخ الضبط</label>
                <input class="form-control customInput violationDate" id="violationDate" type="text" value="${functions.getFormatedDate(violationData.ViolationDate)}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationTime" class="customLabel">وقت الضبط</label>
                <input class="form-control customInput violationTime" id="violationTime" type="text" value="${functions.getFormatedDate(violationData.ViolationTime, "hh:mm A")}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="totalOldPrice" class="customLabel">المبلغ القديم</label>
                <input class="form-control customInput totalOldPrice" id="totalOldPrice" type="text" value="${functions.splitBigNumbersByComma(violationData.TotalOldPrice || 0)}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="totalPriceDue" class="customLabel">المبلغ المستحق</label>
                <input class="form-control customInput totalPriceDue" id="totalPriceDue" type="text" value="${functions.splitBigNumbersByComma(violationData.TotalPriceDue || 0)}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="equipmentType" class="customLabel">نوع المعدة</label>
                <input class="form-control customInput equipmentType" id="equipmentType" type="text" value="${violationData.EquipmentType || "----"}" disabled>
            </div>
        </div>
    `;
    return detailsHtml;
};
////////////////////////////////////////////////

////////////////////////////////////////////////////
quarryViolationReferral.payCaseBeforeEditPopup = (
    ReferralID,
    ViolationID,
    TaskID,
    referralNumber,
    violationCode,
    totalPrice
) => {
    $(".overlay").removeClass("active");
    let popupHtml = `
        <div class="popupHeader">
            <div class="violationsCode"> 
                <p>سداد على نموذج التقييم - الإحالة رقم (${referralNumber})</p>
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
                                        <label for="violationCasePrice" class="customLabel">المبلغ المطلوب سداده</label>
                                        <input class="form-control disabled customInput violationCasePrice" id="violationCasePrice" type="text" value="${functions.splitBigNumbersByComma(totalPrice)}" disabled>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="form-group customFormGroup">
                                        <label for="payCaseAttachment" class="customLabel">إرفاق إيصال السداد</label>
                                        <div class="fileBox" id="dropContainer">
                                            <div class="inputFileBox">
                                                <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                                <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                                <input type="file" class="customInput attachFilesInput payCaseAttachment form-control" id="payCaseAttachment" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx" multiple>
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
                                <div class="btnStyle confirmBtnGreen popupBtn payCaseBeforeEditBtn" id="payCaseBeforeEditBtn">تأكيد السداد</div>
                                <div class="btnStyle cancelBtn popupBtn closePayCasePopup" id="closePayCasePopup" data-dismiss="modal" aria-label="Close">إلغاء</div>
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

    let filesExtension = [
        "gif", "svg", "jpg", "jpeg", "png",
        "doc", "docx", "pdf", "xls", "xlsx", "pptx"
    ];
    let allAttachments;
    let countOfFiles;

    // File attachment handling
    $("#payCaseAttachment").on("change", (e) => {
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

    $(".payCaseBeforeEditBtn").on("click", (e) => {
        if (allAttachments != null && allAttachments.length > 0) {
            $(".overlay").addClass("active");

            // Calculate actual amount paid (remove commas for calculation)
            let actualAmountPaid = totalPrice.toString().replace(/\,/g, "");

            // First change task status, then upload attachment in the success callback
            quarryViolationReferral.changeTaskStatusAfterPayCase(
                TaskID,
                ViolationID,
                "#payCaseAttachment",
                parseFloat(actualAmountPaid),  // Add the actual amount paid
                ReferralID  // Add ReferralID for the request
            );

        } else {
            functions.warningAlert("من فضلك قم بإرفاق إيصال السداد");
        }
    });
};
quarryViolationReferral.payCaseAfterEditPopup = (
    ReferralID,
    ViolationID,
    TaskID,
    referralNumber,
    violationCode,
    totalPrice,
    oldPrice,
    referredAmount
) => {
    $(".overlay").removeClass("active");
    let popupHtml = `
        <div class="popupHeader">
            <div class="violationsCode"> 
                <p>سداد على الإحالة - الإحالة رقم (${referralNumber})</p>
            </div>
        </div>
        <div class="popupBody">
            <div class="popupForm detailsPopupForm" id="detailsPopupForm">

                <div class="formContent">
                    <div class="formBox">
                        <div class="formElements">
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="form-group customFormGroup">
                                        <label for="violationOldPrice" class="customLabel">المبلغ القديم للمخالفة</label>
                                        <input class="form-control disabled customInput violationOldPrice" id="violationOldPrice" type="text" value="${functions.splitBigNumbersByComma(oldPrice)}" disabled>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group customFormGroup">
                                        <label for="referredAmountValue" class="customLabel">مبلغ الإحالة المطلوب</label>
                                        <input class="form-control disabled customInput referredAmountValue" id="referredAmountValue" type="text" value="${functions.splitBigNumbersByComma(referredAmount)}" disabled>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group customFormGroup">
                                        <label for="violationCasePrice" class="customLabel">المبلغ الكلي المطلوب سداده</label>
                                        <input class="form-control disabled customInput violationCasePrice" id="violationCasePrice" type="text" value="${functions.splitBigNumbersByComma(totalPrice)}" disabled>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="form-group customFormGroup">
                                        <label for="payCaseAfterEditAttachment" class="customLabel">إرفاق إيصال السداد</label>
                                        <div class="fileBox" id="dropContainer">
                                            <div class="inputFileBox">
                                                <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                                <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                                <input type="file" class="customInput attachFilesInput payCaseAfterEditAttachment form-control" id="payCaseAfterEditAttachment" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx" multiple>
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
                                <div class="btnStyle confirmBtnGreen popupBtn payCaseAfterEditBtn" id="payCaseAfterEditBtn">تأكيد السداد</div>
                                <div class="btnStyle cancelBtn popupBtn closePayCasePopup" id="closePayCasePopup" data-dismiss="modal" aria-label="Close">إلغاء</div>
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

    let filesExtension = [
        "gif", "svg", "jpg", "jpeg", "png",
        "doc", "docx", "pdf", "xls", "xlsx", "pptx"
    ];
    let allAttachments;
    let countOfFiles;

    // File attachment handling
    $("#payCaseAfterEditAttachment").on("change", (e) => {
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

    $(".payCaseAfterEditBtn").on("click", (e) => {
        if (allAttachments != null && allAttachments.length > 0) {
            $(".overlay").addClass("active");

            // Calculate actual amount paid (remove commas for calculation)
            let actualAmountPaid = totalPrice.toString().replace(/\,/g, "");

            // First change task status, then upload attachment in the success callback
            quarryViolationReferral.changeTaskStatusAfterPayCase(
                TaskID,
                ViolationID,
                "#payCaseAfterEditAttachment",
                parseFloat(actualAmountPaid),  // Add the actual amount paid
                ReferralID  // Add ReferralID for the request
            );

        } else {
            functions.warningAlert("من فضلك قم بإرفاق إيصال السداد");
        }
    });
};
quarryViolationReferral.changeTaskStatusAfterPayCase = (TaskID, ViolationID, attachInput, ActualAmountPaid, ReferralID) => {
    let request = {
        request: {
            Data: {
                ID: TaskID,
                ViolationId: ViolationID,
                ActualAmountPaid: ActualAmountPaid,
                Status: "Paid"
            }
        }
    };

    functions
        .requester("/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Save", request)
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
        })
        .then((data) => {
            if (data.d && data.d.Status) {
                // After successfully updating task status, upload the attachment
                quarryViolationReferral.uploadTaskAttachment(TaskID, attachInput);
            } else {
                functions.warningAlert("حدث خطأ أثناء تحديث حالة المهمة");
                $(".overlay").removeClass("active");
            }
        })
        .catch((err) => {
            console.error("Error updating task status:", err);
            $(".overlay").removeClass("active");
            functions.warningAlert("حدث خطأ أثناء عملية السداد");
        });
};
quarryViolationReferral.uploadTaskAttachment = (TaskId, attachInput, ListName = "ViolationsCycle") => {
    let Data = new FormData();
    Data.append("itemId", TaskId);
    Data.append("listName", ListName);

    // Use the exact same pattern as runningSectorTask
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
            functions.sucessAlert("تم السداد بنجاح");
            functions.closePopup();

            // Refresh the table
            quarryViolationReferral.getQuarryViolationReferrals(
                quarryViolationReferral.pageIndex,
                true
            );
        },
        error: (err) => {
            functions.warningAlert("خطأ في إرسال البيانات لقاعدة البيانات");
            $(".overlay").removeClass("active");
            console.log(err.responseText);
        },
    });
};
///////////////////////////////////////////////////
quarryViolationReferral.init = () => {
    quarryViolationReferral.pageIndex = 1;
    quarryViolationReferral.dataObj.destroyTable = false;

    // Setup event listeners
    $(".searchBtn").off("click").on("click", quarryViolationReferral.filterQuarryViolationReferrals);

    // ADDED: Reset button handler
    $(".resetBtn").off("click").on("click", quarryViolationReferral.resetFilter);

    $(".filterBox input").off("keypress").on("keypress", function (e) {
        if (e.which === 13) {
            quarryViolationReferral.filterQuarryViolationReferrals(e);
        }
    });

    // Load initial data
    $(".PreLoader").addClass("active");
    quarryViolationReferral.getQuarryViolationReferrals();
};

// Also update the filter function to check for empty filters similar to validatedViolations
quarryViolationReferral.filterQuarryViolationReferrals = (e) => {
    e.preventDefault();

    let ReferralNumber = $("#CaseNumber").val();
    let CaseStatus = $("#CaseStatus").val();
    let RefferedDateFrom = $("#RefferedDateFrom").val();
    let RefferedDateTo = $("#RefferedDateTo").val();

    // Check if all filter fields are empty (similar to validatedViolations validation)
    if (
        ReferralNumber === "" &&
        CaseStatus === "" &&
        RefferedDateFrom === "" &&
        RefferedDateTo === ""
    ) {
        functions.warningAlert("من فضلك قم بإدخال قيمة واحدة على الأقل من قيم البحث");
    } else {
        $(".PreLoader").addClass("active");
        pagination.reset();
        quarryViolationReferral.dataObj.destroyTable = true;
        quarryViolationReferral.getQuarryViolationReferrals(
            1,
            true,
            ReferralNumber,
            CaseStatus,
            "Quarry",
            RefferedDateFrom,
            RefferedDateTo
        );
    }
};

$(document).ready(function () {
    if (functions.getPageName() === "QuarryViolationReferralLog") {
        quarryViolationReferral.init();
    }
});

export default quarryViolationReferral;






















// ------------------------------------------------------------------------------------------------------------------------

// import functions from "../../Shared/functions";
// import DetailsPopup from "../../Shared/detailsPopupContent";
// import confirmPopup from "../../Shared/confirmationPopup";
// import pagination from "../../Shared/Pagination";

// let quarryViolationReferral = {
//     dataObj: {
//         destroyTable: false,
//     },
//     pageIndex: 1
// };

// quarryViolationReferral.getQuarryViolationReferrals = (
//     pageIndex = 1,
//     destroyTable = false,
//     ReferralNumber = "",
//     CaseStatus = "",
//     OffenderType = "Quarry",
//     RefferedDateFrom = "",
//     RefferedDateTo = ""
// ) => {
//     let request = {
//         Request: {
//             RowsPerPage: pagination.rowsPerPage || 10,
//             PageIndex: pageIndex,
//             ColName: "created",
//             SortOrder: "desc",
//             ReferralNumber: ReferralNumber,
//             Status: CaseStatus,
//             OffenderType: OffenderType,
//             RefferedDateFrom: RefferedDateFrom
//                 ? moment(RefferedDateFrom, "DD-MM-YYYY").format("YYYY-MM-DD")
//                 : "",
//             RefferedDateTo: RefferedDateTo
//                 ? moment(RefferedDateTo, "DD-MM-YYYY").format("YYYY-MM-DD")
//                 : "",
//         }
//     };

//     Object.keys(request.Request).forEach(key => {
//         if (request.Request[key] === "") {
//             delete request.Request[key];
//         }
//     });

//     functions
//         .requester(
//             "/_layouts/15/Uranium.Violations.SharePoint/Cases.aspx/Search",
//             request
//         )
//         .then((response) => {
//             if (response.ok) {
//                 return response.json();
//             }
//         })
//         .then((data) => {
//             $(".PreLoader").removeClass("active");
//             let Referrals = [];
//             let ItemsData = data?.d?.Result;

//             if (data?.d?.Result?.GridData != null) {
//                 if (data.d.Result.GridData.length > 0) {
//                     Array.from(data.d.Result.GridData).forEach((element) => {
//                         Referrals.push(element);
//                     });
//                 } else {
//                     Referrals = [];
//                 }
//             }

//             const totalPages = ItemsData?.TotalPageCount || 0;
//             const rowsPerPage = ItemsData?.RowsPerPage || pagination.rowsPerPage || 10;
//             const currentPage = ItemsData?.CurrentPage || pageIndex;

//             quarryViolationReferral.setPaginations(totalPages, rowsPerPage);
//             quarryViolationReferral.QuarryViolationReferralTable(
//                 Referrals,
//                 destroyTable || quarryViolationReferral.dataObj.destroyTable
//             );
//             quarryViolationReferral.pageIndex = currentPage;
//         })
//         .catch((err) => {
//             console.error("API Error:", err);
//             $(".PreLoader").removeClass("active");
//             functions.warningAlert("حدث خطأ في تحميل البيانات");
//         });
// };

// quarryViolationReferral.setPaginations = (TotalPages, RowsPerPage) => {
//     pagination.draw("#paginationID", TotalPages, RowsPerPage);
//     pagination.start("#paginationID", quarryViolationReferral.getQuarryViolationReferrals);
//     pagination.activateCurrentPage();
// };

// quarryViolationReferral.resetFilter = (e) => {
//     e.preventDefault();

//     // Clear all filter inputs
//     $("#CaseNumber").val("");
//     $("#CaseStatus").val(""); // This will reset to the first option
//     $("#RefferedDateFrom").val("");
//     $("#RefferedDateTo").val("");

//     // If you want to set CaseStatus to "قيد انتظار تأشيرات النيابة" as default instead of empty
//     // $("#CaseStatus").val("قيد انتظار تأشيرات النيابة");

//     $(".PreLoader").addClass("active");
//     pagination.reset();
//     quarryViolationReferral.dataObj.destroyTable = true;
//     quarryViolationReferral.getQuarryViolationReferrals(1, true);
// };

// quarryViolationReferral.QuarryViolationReferralTable = (Referrals, destroyTable = false) => {
//     let data = [];
//     console.log('Referrals', Referrals)

//     if (Referrals && Referrals.length > 0) {
//         Referrals.forEach((referral) => {
//             let violation = referral?.Violation;
//             let refferedDate = functions.getFormatedDate(referral.RefferedDate);
//             let violationStatus = referral.ViolationStatus || "";
//             let caseStatus = referral.Status || "";
//             let referralNumber = referral.ReferralNumber || "";
//             let caseNumber = referral.CaseNumber || "";
//             let ReferredAmount = violation.ReferredAmount || 0;

//             // Determine which actions to show based on business rules
//             let hasAddReferralNumberAction = false;
//             let hasEditAmountAction = false;
//             let hasPayCaseBeforeEditAction = false; // سداد على نموذج التقييم
//             let hasPayCaseAfterEditAction = false;  // سداد على الإحالة
//             let canShowDetailsOnly = false;

//             // Business Rule 1: Add Referral Number
//             if (!referralNumber &&
//                 caseStatus == "قيد انتظار رقم الإحالة" &&
//                 violationStatus == "UnderReview") {
//                 hasAddReferralNumberAction = true;
//             }

//             // Business Rule 2: Edit Amount
//             if (referralNumber &&
//                 ReferredAmount <= 0 &&
//                 caseStatus == "تم التسليم للتحريات" &&
//                 violationStatus == "UnderReview") {
//                 hasEditAmountAction = true;
//             }

//             // Business Rule 3: Pay Case Before Edit (سداد على نموذج التقييم)
//             if (referralNumber &&
//                 ReferredAmount <= 0 &&
//                 caseStatus == "قيد انتظار تأشيرات النيابة" &&
//                 violationStatus == "UnderReview") {
//                 hasPayCaseBeforeEditAction = true;
//             }

//             // Business Rule 4: Pay Case After Edit (سداد على الإحالة)
//             if (referralNumber &&
//                 ReferredAmount > 0 &&
//                 caseStatus == "تم التسليم للتحريات" &&
//                 violationStatus == "UnderReview") {
//                 hasPayCaseAfterEditAction = true;
//             }

//             // Business Rule 5: Paid - show details only
//             if (violationStatus == "Paid") {
//                 canShowDetailsOnly = true;
//             }

//             // Build actions menu HTML
//             let actionsMenuHTML = '';
//             if (canShowDetailsOnly) {
//                 actionsMenuHTML = `
//                 <ul class='list-unstyled controlsList'>
//                     <li><a href="#" class="itemDetails">المزيد من التفاصيل</a></li>
//                 </ul>`;
//             } else {
//                 actionsMenuHTML = `
//                 <ul class='list-unstyled controlsList'>
//                     <li><a href="#" class="itemDetails">المزيد من التفاصيل</a></li>`;

//                 if (hasAddReferralNumberAction) {
//                     actionsMenuHTML += `
//                     <li><a href="#" class="addReferralNumberAction" 
//                            data-referralid="${referral.ID}"
//                            data-violationid="${referral.ViolationId}"
//                            data-taskid="${referral.TaskId}"
//                            data-violationcode="${referral.ViolationCode}">إضافة رقم الإحالة</a></li>`;
//                 }

//                 if (hasEditAmountAction) {
//                     actionsMenuHTML += `
//                     <li><a href="#" class="editAmountAction"
//                            data-referralid="${referral.ID}"
//                            data-violationid="${referral.ViolationId}"
//                            data-taskid="${referral.TaskId}"
//                            data-totaloldprice="${violation?.TotalPriceDue || 0}"
//                            data-referralnumber="${referral.ReferralNumber || ''}">تعديل مبلغ الإحالة</a></li>`;
//                 }

//                 if (hasPayCaseBeforeEditAction) {
//                     actionsMenuHTML += `
//                     <li><a href="#" class="payCaseBeforeEditAction"
//                            data-referralid="${referral.ID}"
//                            data-violationid="${violation?.ID}"
//                            data-taskid="${referral.TaskId}"
//                            data-referralnumber="${referral.ReferralNumber || ''}"
//                            data-violationcode="${referral.ViolationCode}"
//                            data-totalprice="${violation?.TotalPriceDue || 0}"
//                            data-oldprice="${violation?.TotalOldPrice || 0}">سداد على نموذج التقييم</a></li>`;
//                 }

//                 if (hasPayCaseAfterEditAction) {
//                     actionsMenuHTML += `
//                     <li><a href="#" class="payCaseAfterEditAction"
//                            data-referralid="${referral.ID}"
//                            data-violationid="${violation?.ID}"
//                            data-taskid="${referral.TaskId}"
//                            data-referralnumber="${referral.ReferralNumber || ''}"
//                            data-violationcode="${referral.ViolationCode}"
//                            data-totalprice="${violation?.TotalPriceDue || 0}"
//                            data-referredamount="${ReferredAmount}"
//                            data-oldprice="${violation?.TotalOldPrice || 0}">سداد على الإحالة</a></li>`;
//                 }

//                 actionsMenuHTML += `</ul>`;
//             }

//             let displayViolationStatus = quarryViolationReferral.getViolationStatus(violationStatus);
//             // let displayCaseStatus = quarryViolationReferral.getCaseStatus(caseStatus); // Use the new function
//             // `<div class="referralStatus">${displayCaseStatus || "-----"}</div>`, // Updated this line

//             data.push([
//                 `<div class="violationCode noWrapContent" 
//                         data-referralid="${referral.ID}" 
//                         data-violationid="${referral.ViolationId}" 
//                         data-taskid="${referral.TaskId}" 
//                         data-referralstatus="${referral.Status}" 
//                         data-referralnumber="${referral.ReferralNumber}" 
//                         data-violationcode="${referral.ViolationCode}" 
//                         data-oldprice="${violation?.TotalOldPrice}" 
//                         data-newprice="${violation?.TotalPriceDue}"
//                         data-referredamount="${ReferredAmount}"
//                         data-offendertype="${violation?.OffenderType}"
//                         data-casenumber="${caseNumber}"
//                         data-violationstatus="${violationStatus}">
//                         ${referral.ViolationCode}
//                 </div>`,
//                 `<div class='controls'>
//                     <div class='ellipsisButton'>
//                         <i class='fa-solid fa-ellipsis-vertical'></i>
//                     </div>
//                     <div class="hiddenListBox">
//                         <div class='arrow'></div>
//                         ${actionsMenuHTML}
//                     </div>
//                 </div>`,
//                 `<div class="refferedDate noWrapContent">${refferedDate}</div>`,
//                 `<div class="referralNumber">${referralNumber || "-----"}</div>`,
//                 `<div class="violationStatus">${displayViolationStatus || "-----"}</div>`,
//                 `<div class="referralStatus">${caseStatus || "-----"}</div>`,
//                 `<div class="referralAttachments caseAttachments"><a href="#!" style="color: black;">المرفقات</a></div>`,
//             ]);
//         });
//     } else {
//         data.push([
//             `<div class="no-data">لا توجد بيانات متاحة</div>`,
//             "",
//             "",
//             "",
//             "",
//             "",
//             ""
//         ]);
//     }

//     let Table = functions.tableDeclare(
//         "#QuarryViolationReferralTable",
//         data,
//         [
//             { title: "رقم المخالفة" },
//             { title: "", class: "all" },
//             { title: "تاريخ الإحالة" },
//             { title: "رقم الإحالة" },
//             { title: "حالة المخالفة" },
//             { title: "موقف الإحالة" },
//             { title: "المرفقات" },
//         ],
//         false,
//         destroyTable,
//         "سجل إحالات المخالفات المحجرية.xlsx",
//         "سجل إحالات المخالفات المحجرية"
//     );

//     if (destroyTable && $.fn.DataTable.isDataTable("#QuarryViolationReferralTable")) {
//         $("#QuarryViolationReferralTable").DataTable().destroy();
//     }

//     // Event handlers
//     $(document).off('click', '.ellipsisButton').on('click', '.ellipsisButton', function (e) {
//         e.stopPropagation();
//         $(".hiddenListBox").hide(300);
//         $(this).siblings(".hiddenListBox").toggle(300);
//     });

//     $(document).on('click', function (e) {
//         if (!$(e.target).closest('.controls').length) {
//             $(".hiddenListBox").hide(300);
//         }
//     });

//     let referralsLog = Table.rows().nodes().to$();
//     quarryViolationReferral.dataObj.destroyTable = true;

//     referralsLog.each(function (index) {
//         let jQueryRecord = $(this);

//         if (jQueryRecord.find(".no-data").length === 0) {
//             let referralID = jQueryRecord.find(".violationCode").data("referralid");
//             let referralNumber = jQueryRecord.find(".violationCode").data("referralnumber");
//             let hiddenListBox = jQueryRecord.find(".controls").children(".hiddenListBox");

//             // Attachments click handler - USING SAME STRUCTURE AS violationsCases
//             jQueryRecord.find(".referralAttachments").find("a").off('click').on('click', function (e) {
//                 e.preventDefault();
//                 $(".overlay").addClass("active");
//                 quarryViolationReferral.getReferralAttachmentsByReferralId(referralID, referralNumber);
//             });

//             // Details click handler
//             jQueryRecord.find(".itemDetails").off('click').on('click', function (e) {
//                 e.preventDefault();
//                 e.stopPropagation();
//                 $(".overlay").addClass("active");
//                 quarryViolationReferral.FindReferralById(referralID);
//                 $(".hiddenListBox").hide(300);
//             });

//             // Position dropdown if needed
//             if (referralsLog.length > 3 && hiddenListBox.height() > 110 &&
//                 jQueryRecord.is(":nth-last-child(-n + 4)")) {
//                 hiddenListBox.addClass("toTopDDL");
//             }
//         }
//     });

//     // Add Referral Number Action - MATCHING violationsCases STRUCTURE
//     $(document).off('click', '.addReferralNumberAction').on('click', '.addReferralNumberAction', function (e) {
//         e.preventDefault();
//         e.stopPropagation();

//         let referralId = $(this).data('referralid');
//         let violationId = $(this).data('violationid');
//         let taskId = $(this).data('taskid');
//         let violationCode = $(this).data('violationcode');

//         console.log('Add Referral Action:', { referralId, violationId, taskId, violationCode });

//         // Show popup similar to violationsCases.addCaseNumberPopup
//         quarryViolationReferral.addReferralNumberPopup(referralId, violationId, violationCode, taskId);

//         $(".hiddenListBox").hide(300);
//     });

//     // Edit Amount Action - MATCHING violationsCases STRUCTURE
//     $(document).off('click', '.editAmountAction').on('click', '.editAmountAction', function (e) {
//         e.preventDefault();
//         e.stopPropagation();

//         let referralId = $(this).data('referralid');
//         let violationId = $(this).data('violationid');
//         let taskId = $(this).data('taskid');
//         let totalOldPrice = $(this).data('totaloldprice');
//         let referralNumber = $(this).data('referralnumber');

//         // Show popup similar to violationsCases.editCasePrice
//         quarryViolationReferral.editReferralAmountPopup(referralId, violationId, taskId, referralNumber, totalOldPrice);

//         $(".hiddenListBox").hide(300);
//     });

//     // Pay Case Before Edit Action (سداد على نموذج التقييم)
//     $(document).off('click', '.payCaseBeforeEditAction').on('click', '.payCaseBeforeEditAction', function (e) {
//         e.preventDefault();
//         e.stopPropagation();

//         let referralId = $(this).data('referralid');
//         let violationId = $(this).data('violationid');
//         let taskId = $(this).data('taskid');
//         let referralNumber = $(this).data('referralnumber');
//         let violationCode = $(this).data('violationcode');
//         let totalPrice = $(this).data('totalprice');
//         let oldPrice = $(this).data('oldprice');

//         console.log('Pay Case Before Edit:', {
//             referralId,
//             violationId,
//             taskId,
//             referralNumber,
//             violationCode,
//             totalPrice,
//             oldPrice
//         });

//         quarryViolationReferral.payCaseBeforeEditPopup(
//             referralId,
//             violationId,
//             taskId,
//             referralNumber,
//             violationCode,
//             totalPrice
//         );

//         $(".hiddenListBox").hide(300);
//     });

//     // Pay Case After Edit Action (سداد على الإحالة)
//     $(document).off('click', '.payCaseAfterEditAction').on('click', '.payCaseAfterEditAction', function (e) {
//         e.preventDefault();
//         e.stopPropagation();

//         let referralId = $(this).data('referralid');
//         let violationId = $(this).data('violationid');
//         let taskId = $(this).data('taskid');
//         let referralNumber = $(this).data('referralnumber');
//         let violationCode = $(this).data('violationcode');
//         let totalPrice = $(this).data('totalprice');
//         let oldPrice = $(this).data('oldprice');
//         let referredAmount = $(this).data('referredamount');

//         console.log('Pay Case After Edit:', {
//             referralId,
//             violationId,
//             taskId,
//             referralNumber,
//             violationCode,
//             totalPrice,
//             oldPrice,
//             referredAmount
//         });

//         quarryViolationReferral.payCaseAfterEditPopup(
//             referralId,
//             violationId,
//             taskId,
//             referralNumber,
//             violationCode,
//             totalPrice,
//             oldPrice,
//             referredAmount
//         );

//         $(".hiddenListBox").hide(300);
//     });

//     $(document).on('click', '.controlsList a', function (e) {
//         $(this).closest('.hiddenListBox').hide(300);
//     });

//     functions.hideTargetElement(".controls", ".hiddenListBox");
// };

// quarryViolationReferral.addReferralNumberPopup = (ReferralID, ViolationID, ViolationCode, TaskID) => {
//     $(".overlay").removeClass("active");
//     let popupHtml = `
//         <div class="popupHeader">
//             <div class="violationsCode"> 
//                 <p>إضافة رقم الإحالة للمخالفة رقم (${ViolationCode})</p>
//             </div>
//         </div>
//         <div class="popupBody">
//             <div class="popupForm detailsPopupForm" id="detailsPopupForm">

//                 <div class="formContent">
//                     <div class="formBox">
//                         <div class="formElements">
//                             <div class="row">
//                                 <div class="col-md-6">
//                                     <div class="form-group customFormGroup">
//                                         <label for="referralNumber" class="customLabel">رقم الإحالة</label>
//                                         <input class="form-control customInput referralNumber" id="referralNumber" type="text" placeholder="أدخل رقم الإحالة">
//                                     </div>
//                                 </div>
//                                 <div class="col-md-6">
//                                     <div class="form-group customFormGroup">
//                                         <label for="referralComments" class="customLabel">ملاحظات</label>
//                                         <textarea class="form-control customTextArea referralComments" id="referralComments" rows="3" placeholder="أدخل الملاحظات"></textarea>
//                                     </div>
//                                 </div>
//                                 <div class="col-12">
//                                     <div class="form-group customFormGroup">
//                                         <label for="referralNumberAttach" class="customLabel">إرفاق مستند رقم الإحالة</label>
//                                         <div class="fileBox" id="dropContainer">
//                                             <div class="inputFileBox">
//                                                 <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
//                                                 <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
//                                                 <input type="file" class="customInput attachFilesInput referralNumberAttach form-control" id="referralNumberAttach" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx" multiple>
//                                             </div>
//                                         </div>
//                                         <div class="dropFilesArea" id="dropFilesArea"></div>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 <div class="formButtonsBox">
//                     <div class="row">
//                         <div class="col-12">
//                             <div class="buttonsBox centerButtonsBox">
//                                 <div class="btnStyle confirmBtnGreen popupBtn AddReferralNumberBtn" id="AddReferralNumberBtn">تأكيد</div>
//                                 <div class="btnStyle cancelBtn popupBtn closeReferralNumberPopup" id="closeReferralNumberPopup" data-dismiss="modal" aria-label="Close">إلغاء</div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//             </div>
//         </div>`;

//     functions.declarePopup(
//         ["generalPopupStyle", "greenPopup", "editPopup"],
//         popupHtml
//     );

//     let ReferralNumberInput = $("#referralNumber").val();
//     let ReferralCommentsInput = $("#referralComments").val();
//     let filesExtension = [
//         "gif", "svg", "jpg", "jpeg", "png",
//         "doc", "docx", "pdf", "xls", "xlsx", "pptx"
//     ];
//     let allAttachments;
//     let countOfFiles;
//     let request = {};

//     // File attachment handling - SAME AS violationsCases
//     $("#referralNumberAttach").on("change", (e) => {
//         allAttachments = $(e.currentTarget)[0].files;
//         if (allAttachments.length > 0) {
//             $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").show().empty();
//         }
//         for (let i = 0; i < allAttachments.length; i++) {
//             $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").append(`
//                 <div class="file">
//                     <p class="fileName">${allAttachments[i].name}</p>
//                     <span class="deleteFile" data-index="${i}"><i class="fa-sharp fa-solid fa-x"></i></span>
//                 </div>
//             `);
//         }

//         $(".deleteFile").on("click", (event) => {
//             let index = $(event.currentTarget).closest(".file").index();
//             $(event.currentTarget).closest(".file").remove();
//             let fileBuffer = new DataTransfer();
//             for (let i = 0; i < allAttachments.length; i++) {
//                 if (index !== i) {
//                     fileBuffer.items.add(allAttachments[i]);
//                 }
//             }
//             allAttachments = fileBuffer.files;
//             countOfFiles = allAttachments.length;
//             if (countOfFiles == 0) {
//                 $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
//             }
//         });

//         for (let i = 0; i < allAttachments.length; i++) {
//             let fileSplited = allAttachments[i].name.split(".");
//             let fileExt = fileSplited[fileSplited.length - 1].toLowerCase();
//             if ($.inArray(fileExt, filesExtension) == -1) {
//                 functions.warningAlert("من فضلك أدخل الملفات بالامتدادات المسموح بها فقط");
//                 $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
//                 $(e.currentTarget).val("");
//             }
//         }
//     });

//     $("#referralNumber").on("keyup", (e) => {
//         ReferralNumberInput = $(e.currentTarget).val().trim();
//     });

//     $("#referralComments").on("keyup", (e) => {
//         ReferralCommentsInput = $(e.currentTarget).val().trim();
//     });

//     $(".AddReferralNumberBtn").on("click", (e) => {
//         if (ReferralNumberInput != "") {
//             if (allAttachments != null && allAttachments.length > 0) {
//                 request = {
//                     Request: {
//                         Title: "تم إضافة رقم الإحالة",
//                         Comments: ReferralCommentsInput,
//                         Status: "قيد الانتظار القطاع",
//                         ViolationId: ViolationID,
//                         ReferralNumber: ReferralNumberInput,
//                         TaskId: TaskID,
//                         ID: ReferralID
//                     },
//                 };
//                 $(".overlay").addClass("active");
//                 quarryViolationReferral.editReferralAPIResponse(
//                     request,
//                     ReferralID,
//                     "إضافة رقم الإحالة",
//                     "#referralNumberAttach",
//                     "تم إضافة رقم الإحالة"
//                 );
//             } else {
//                 functions.warningAlert("من فضلك قم بإرفاق المستند المرفق به رقم الإحالة");
//             }
//         } else {
//             functions.warningAlert("من فضلك قم بإضافة رقم الإحالة بشكل صحيح");
//         }
//     });
// };

// quarryViolationReferral.editReferralAmountPopup = (
//     ReferralID,
//     ViolationID,
//     TaskID,
//     referralNumber,
//     oldPrice,
// ) => {
//     $(".overlay").removeClass("active");
//     let popupHtml = `
//         <div class="popupHeader">
//             <div class="violationsCode"> 
//                 <p>تعديل مبلغ الإحالة رقم (${referralNumber})</p>
//             </div>
//         </div> 
//         <div class="popupBody">
//             <div class="popupForm detailsPopupForm" id="detailsPopupForm">

//                 <div class="formContent"> 
//                     <div class="formBox">
//                         <div class="formElements">
//                             <div class="row">
//                                 <div class="col-md-4">
//                                     <div class="form-group customFormGroup">
//                                         <label for="oldViolationPrice" class="customLabel">المبلغ القديم</label>
//                                         <input class="form-control disabled customInput oldViolationPrice" id="oldViolationPrice" type="text" value="${functions.splitBigNumbersByComma(oldPrice)}" disabled>
//                                     </div> 
//                                 </div>
//                                 <div class="col-md-4">
//                                     <div class="form-group customFormGroup">
//                                         <label for="referredAmount" class="customLabel">غرامة التسليم للتحريات</label>
//                                         <input class="form-control customInput referredAmount" id="referredAmount" type="text" placeholder="أدخل قيمة الغرامة">
//                                     </div>
//                                 </div>
//                                 <div class="col-md-4">
//                                     <div class="form-group customFormGroup">
//                                         <label for="newTotalAmount" class="customLabel">المبلغ الكلي (الإحالة)</label>
//                                         <input class="form-control customInput newTotalAmount" id="newTotalAmount" type="text" placeholder="سيتم حسابه تلقائياً" disabled>
//                                     </div>
//                                 </div>
//                                 <div class="col-md-12">
//                                     <div class="form-group customFormGroup">
//                                         <label for="amountComments" class="customLabel">ملاحظات</label>
//                                         <textarea class="form-control customTextArea amountComments" id="amountComments" placeholder="أدخل الملاحظات"></textarea>
//                                     </div>
//                                 </div>
//                                 <div class="col-12">
//                                     <div class="form-group customFormGroup">
//                                         <label for="editReferralAmountAttach" class="customLabel">إرفاق مستند إعادة التقييم</label>
//                                         <div class="fileBox" id="dropContainer">
//                                             <div class="inputFileBox">
//                                                 <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
//                                                 <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
//                                                 <input type="file" class="customInput attachFilesInput editReferralAmountAttach form-control" id="editReferralAmountAttach" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx" multiple>
//                                             </div>
//                                         </div>
//                                         <div class="dropFilesArea" id="dropFilesArea"></div>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 <div class="formButtonsBox">
//                     <div class="row">
//                         <div class="col-12">
//                             <div class="buttonsBox centerButtonsBox">
//                                 <div class="btnStyle confirmBtnGreen popupBtn editReferralAmountBtn" id="editReferralAmountBtn">تعديل</div>
//                                 <div class="btnStyle cancelBtn popupBtn closeReferralAmountPopup" id="closeReferralAmountPopup" data-dismiss="modal" aria-label="Close">إلغاء</div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//             </div>
//         </div>`;

//     functions.declarePopup(
//         ["generalPopupStyle", "greenPopup", "editPopup"],
//         popupHtml
//     );

//     // Remove commas from oldPrice to get the actual numeric value
//     let OldViolationPrice = oldPrice.toString().replace(/\,/g, "");
//     let ReferredAmountInput = "";
//     let NewTotalAmountInput = "";
//     let AmountCommentsInput = "";
//     let filesExtension = [
//         "gif", "svg", "jpg", "jpeg", "png",
//         "doc", "docx", "pdf", "xls", "xlsx", "pptx"
//     ];
//     let allAttachments;
//     let countOfFiles;
//     let PositiveDecimalNumbers = /^[+]?([0-9]+(?:[\.][0-9]*)?|\.[0-9]+)$/;
//     let request = {};

//     // File attachment handling - SAME AS violationsCases
//     $("#editReferralAmountAttach").on("change", (e) => {
//         allAttachments = $(e.currentTarget)[0].files;
//         if (allAttachments.length > 0) {
//             $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").show().empty();
//         }
//         for (let i = 0; i < allAttachments.length; i++) {
//             $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").append(`
//                 <div class="file">
//                     <p class="fileName">${allAttachments[i].name}</p>
//                     <span class="deleteFile" data-index="${i}"><i class="fa-sharp fa-solid fa-x"></i></span>
//                 </div>
//             `);
//         }

//         $(".deleteFile").on("click", (event) => {
//             let index = $(event.currentTarget).closest(".file").index();
//             $(event.currentTarget).closest(".file").remove();
//             let fileBuffer = new DataTransfer();
//             for (let i = 0; i < allAttachments.length; i++) {
//                 if (index !== i) {
//                     fileBuffer.items.add(allAttachments[i]);
//                 }
//             }
//             allAttachments = fileBuffer.files;
//             countOfFiles = allAttachments.length;
//             if (countOfFiles == 0) {
//                 $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
//             }
//         });

//         for (let i = 0; i < allAttachments.length; i++) {
//             let fileSplited = allAttachments[i].name.split(".");
//             let fileExt = fileSplited[fileSplited.length - 1].toLowerCase();
//             if ($.inArray(fileExt, filesExtension) == -1) {
//                 functions.warningAlert("من فضلك أدخل الملفات بالامتدادات المسموح بها فقط");
//                 $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
//                 $(e.currentTarget).val("");
//             }
//         }
//     });

//     // Calculate total when referred amount changes
//     $("#referredAmount").on("keypress", (e) => {
//         return functions.isDecimalNumberKey(e);
//     });

//     $("#referredAmount").on("keyup", (e) => {
//         // Remove commas for calculation, then add them back for display
//         let rawValue = $(e.currentTarget).val().replace(/\,/g, "");
//         ReferredAmountInput = rawValue;

//         // Format for display
//         $(e.currentTarget).val(
//             rawValue.replace(/\B(?=(?:\d{3})+(?!\d))/g, ",")
//         );

//         // Calculate new total
//         let oldAmount = parseFloat(OldViolationPrice) || 0;
//         let referredAmount = parseFloat(ReferredAmountInput) || 0;
//         let newTotal = oldAmount + referredAmount;

//         // Update total field
//         let formattedTotal = functions.splitBigNumbersByComma(newTotal.toString());
//         $("#newTotalAmount").val(formattedTotal);
//         NewTotalAmountInput = newTotal.toString();
//     });

//     $("#amountComments").on("keyup", (e) => {
//         AmountCommentsInput = $(e.currentTarget).val().trim();
//     });

//     $("#editReferralAmountBtn").on("click", (e) => {
//         // Remove any commas from input before validation
//         let cleanReferredAmount = ReferredAmountInput.replace(/\,/g, "");

//         if (cleanReferredAmount != "" && PositiveDecimalNumbers.test(cleanReferredAmount)) {
//             if (allAttachments != null && allAttachments.length > 0) {
//                 request = {
//                     Request: {
//                         Title: "تم تعديل مبلغ الإحالة",
//                         Comments: AmountCommentsInput,
//                         ViolationId: ViolationID,
//                         ID: ReferralID,
//                         TaskId: TaskID,
//                         ReferredAmount: parseFloat(cleanReferredAmount),
//                         TotalPriceDue: parseFloat(NewTotalAmountInput),
//                         TotalOldPrice: parseFloat(OldViolationPrice)
//                     },
//                 };
//                 console.log("Sending request:", request); // For debugging
//                 $(".overlay").addClass("active");
//                 quarryViolationReferral.editReferralAPIResponse(
//                     request,
//                     ReferralID,
//                     "تعديل المبلغ",
//                     "#editReferralAmountAttach",
//                     "تم تعديل مبلغ الإحالة بناء على إعادة التقييم"
//                 );
//             } else {
//                 functions.warningAlert("من فضلك قم بإرفاق المستند الخاص بإعادة التقييم");
//             }
//         } else {
//             functions.warningAlert("من فضلك قم بإدخال قيمة غرامة التسليم للتحريات بشكل صحيح");
//         }
//     });
// };
// quarryViolationReferral.editReferralAPIResponse = (
//     request,
//     ReferralId,
//     uploadPhase,
//     attachInput,
//     Message = ""
// ) => {
//     functions
//         .requester(
//             "/_layouts/15/Uranium.Violations.SharePoint/Cases.aspx/Save",
//             request
//         )
//         .then((response) => {
//             if (response.ok) {
//                 return response.json();
//             }
//         })
//         .then((data) => {
//             if (data.d.Status) {
//                 quarryViolationReferral.addNewReferralAttachmentRecord(
//                     ReferralId,
//                     uploadPhase,
//                     attachInput,
//                     Message
//                 );
//             } else {
//                 functions.warningAlert("هناك خطأ في إرسال بيانات الطلب");
//             }
//         })
//         .catch((err) => {
//             console.error(err);
//             functions.warningAlert("حدث خطأ في الاتصال بالخادم");
//         });
// };

// quarryViolationReferral.addNewReferralAttachmentRecord = (
//     ReferralId,
//     uploadPhase,
//     attachInput,
//     Message = "",
//     Comments = ""
// ) => {
//     let request = {
//         Request: {
//             Title: "New Attachment Record",
//             CaseId: ReferralId,
//             UploadPhase: uploadPhase,
//             Comments: Comments,
//         },
//     };

//     functions
//         .requester(
//             "/_layouts/15/Uranium.Violations.SharePoint/CaseAttachments.aspx/Save",
//             request
//         )
//         .then((response) => {
//             if (response.ok) {
//                 return response.json();
//             }
//         })
//         .then((data) => {
//             if (data.d.Status) {
//                 let RecordId = data.d.Result.Id;
//                 quarryViolationReferral.uploadReferralAttachments(
//                     RecordId,
//                     attachInput,
//                     "CasesAttachments",
//                     Message
//                 );
//             } else {
//                 functions.warningAlert("هناك خطأ في إرسال بيانات الطلب");
//             }
//         })
//         .catch((err) => {
//             console.error(err);
//             functions.warningAlert("حدث خطأ في الاتصال بالخادم");
//         });
// };

// quarryViolationReferral.uploadReferralAttachments = (
//     RecordId,
//     attachInput,
//     ListName,
//     Message
// ) => {
//     let Data = new FormData();
//     Data.append("itemId", RecordId);
//     Data.append("listName", ListName);
//     for (let i = 0; i <= $(attachInput)[0].files.length; i++) {
//         Data.append("file" + i, $(attachInput)[0].files[i]);
//     }

//     $.ajax({
//         type: "POST",
//         url: "/_layouts/15/Uranium.Violations.SharePoint/Attachments.aspx/Upload",
//         processData: false,
//         contentType: false,
//         data: Data,
//         success: (data) => {
//             $(".overlay").removeClass("active");
//             functions.sucessAlert(Message);
//             functions.closePopup();
//             // Refresh the table
//             quarryViolationReferral.getQuarryViolationReferrals(
//                 quarryViolationReferral.pageIndex,
//                 true
//             );
//         },
//         error: (err) => {
//             functions.warningAlert("خطأ في إرسال البيانات لقاعدة البيانات");
//             $(".overlay").removeClass("active");
//         },
//     });
// };

// quarryViolationReferral.getReferralAttachmentsByReferralId = (ReferralId, referralNumber) => {
//     let request = {
//         Request: {
//             CaseId: ReferralId,
//         }
//     };

//     functions
//         .requester(
//             "/_layouts/15/Uranium.Violations.SharePoint/CaseAttachments.aspx/Search",
//             request
//         )
//         .then((response) => {
//             if (response.ok) {
//                 return response.json();
//             }
//         })
//         .then((data) => {
//             let ReferralAttachmentsRecords;
//             if (data.d.Status) {
//                 if (data.d.Result.length > 0) {
//                     ReferralAttachmentsRecords = data.d.Result;
//                 } else {
//                     ReferralAttachmentsRecords = [];
//                 }
//                 quarryViolationReferral.referralAttachmentsDetailsPopup(
//                     ReferralId,
//                     referralNumber,
//                     ReferralAttachmentsRecords
//                 );
//             }
//         })
//         .catch((err) => {
//             console.error(err);
//             functions.warningAlert("هناك خطأ في إرسال بيانات الطلب");
//         });
// };

// quarryViolationReferral.referralAttachmentsDetailsPopup = (
//     ReferralId,
//     referralNumber,
//     ReferralAttachmentsRecords
// ) => {
//     let popupHtml = `
//         <div class="popupHeader attachPopup">
//             <div class="violationsCode"> 
//                 <p>مرفقات الإحالة رقم (${referralNumber || "-----"})</p>
//             </div>
//             <div class="btnStyle cancelBtn popupBtn closeReferralAttachPopup" id="closeReferralAttachPopup" style="color: #fff;cursor: pointer;" data-dismiss="modal" aria-label="Close">
//                 <i class="fa-solid fa-x"></i>
//             </div>
//         </div> 
//         <div class="popupBody">
//             <div class="popupTableBox">
//                 <table id="referralAttachmentsTable" class="table tableWithIcons popupTable"></table>
//             </div>
//         </div>`;

//     functions.declarePopup(
//         ["generalPopupStyle", "greenPopup", "editPopup", "attachPopup"],
//         popupHtml
//     );

//     quarryViolationReferral.drawReferralAttachmentsPopupTable(
//         "#referralAttachmentsTable",
//         ReferralAttachmentsRecords
//     );

//     // Add close button handler
//     $("#closeReferralAttachPopup").on("click", function () {
//         functions.closePopup();
//     });
// };

// quarryViolationReferral.drawReferralAttachmentsPopupTable = (
//     TableId,
//     ReferralAttachmentsRecords
// ) => {
//     $(".overlay").removeClass("active");
//     let data = [];
//     let counter = 1;

//     if (ReferralAttachmentsRecords.length > 0) {
//         ReferralAttachmentsRecords.forEach((attchRecord) => {
//             let attachedFilesData = attchRecord.Attachments;
//             data.push([
//                 `<div class="attachCount">${counter}</div>`,
//                 `<div class="attachFiles" data-fileslength="${attachedFilesData.length}">
//                     ${quarryViolationReferral.drawAttachmentsInTable(attachedFilesData)}
//                 </div>`,
//                 `<div class="attachUploadPhase">${attchRecord.UploadPhase}</div>`,
//                 `<div class="attachUploadDate">${functions.getFormatedDate(
//                     attchRecord.Created,
//                     "DD-MM-YYYY hh:mm A"
//                 )}</div>`,
//                 `<div class="attachComments">${attchRecord.Comments != ""
//                     ? attchRecord.Comments
//                     : "----"
//                 }</div>`,
//             ]);
//             counter++;
//         });
//     }

//     let Table = functions.tableDeclare(
//         TableId,
//         data,
//         [
//             { title: "م", class: "tableCounter" },
//             { title: "المرفقات", class: "attachBoxHeader" },
//             { title: "سبب الإرفاق" },
//             { title: "تاريخ الإرفاق" },
//             { title: "ملاحظات" },
//         ],
//         false,
//         false
//     );

//     let referralAttachmentsLog = Table.rows().nodes().to$();
//     $.each(referralAttachmentsLog, (index, record) => {
//         let jQueryRecord = $(record);
//         let attachFiles = jQueryRecord.find(".attachFiles");
//         let attachFilesLength = jQueryRecord.find(".attachFiles").data("fileslength");

//         if (attachFilesLength == 1) {
//             attachFiles.find(".attchedFile").addClass("singleFile");
//         }
//         if (attachFilesLength == 2) {
//             attachFiles.find(".attchedFile").addClass("multibleFiles");
//         }
//         if (attachFilesLength >= 3) {
//             attachFiles.find(".attchedFile").addClass("manyFiles");
//         }
//     });
// };

// quarryViolationReferral.drawAttachmentsInTable = (Attachments) => {
//     let attachmentsBox = ``;

//     if (Attachments.length > 0) {
//         Attachments.forEach((attachment) => {
//             attachmentsBox += `
//                 <a class="attchedFile" target="_blank" href="${attachment.Url}" download="${attachment.Name}" title="${attachment.Name}">
//                     <div class="attachDetailsBox">
//                         <p class="attchedFileName">${attachment.Name}</p>
//                     </div>
//                     <span><i class="fa-solid fa-download"></i></span>
//                 </a>
//             `;
//         });
//     } else {
//         attachmentsBox = `<p class="noAttachedFiles">لا يوجد مرفقات</p>`;
//     }
//     return attachmentsBox;
// };

// quarryViolationReferral.FindReferralById = (ReferralID, popupType = "") => {
//     let request = {
//         Id: ReferralID,
//     };

//     functions
//         .requester(
//             "/_layouts/15/Uranium.Violations.SharePoint/Cases.aspx/FindById",
//             request
//         )
//         .then((response) => {
//             if (response.ok) {
//                 return response.json();
//             }
//         })
//         .then((data) => {
//             let referralData;
//             let violationData;
//             let Content;

//             if (data != null) {
//                 referralData = data.d.Result;

//                 // Get violation details separately
//                 let violationRequest = {
//                     Id: referralData.ViolationId,
//                 };

//                 return functions.requester(
//                     "/_layouts/15/Uranium.Violations.SharePoint/Violations.aspx/FindbyId",
//                     violationRequest
//                 ).then(response => {
//                     if (response.ok) {
//                         return response.json();
//                     }
//                 });
//             } else {
//                 throw new Error("No referral data");
//             }
//         })
//         .then((violationResponse) => {
//             if (violationResponse && violationResponse.d) {
//                 violationData = violationResponse.d;

//                 // Create a popup with DetailsPopup component
//                 $(".overlay").removeClass("active");

//                 let popupTitle = referralData.ReferralNumber
//                     ? `تفاصيل الإحالة رقم (${referralData.ReferralNumber})`
//                     : `تفاصيل الإحالة عن المخالفة رقم (${referralData.ViolationCode})`;

//                 let popupHtml = `
//                     <div class="popupHeader">
//                         <div class="violationsCode"> 
//                             <p>${popupTitle}</p>
//                             <div class="printBtn"><img src="/Style Library/MiningViolations/images/GreenPrintBtn.png" alt="Print Button"></div>
//                         </div>
//                         <div class="backBtn">
//                             <div class="bootpopup-button close" data-dismiss="modal" aria-label="Close">
//                                <a href="#!"> العودة إلى سجل إحالات المحاجر <i class="fa-solid fa-angle-left"></i></a>
//                             </div>
//                         </div>
//                     </div>
//                     <div class="popupBody" style="overflow-y: auto; max-height: 80vh;">
//                         <div class="popupForm detailsPopupForm" id="detailsPopupForm">
//                             <div class="formContent">
//                                 <!-- Case/Referral Details Section -->
//                                 <div class="popupFormBoxHeader">
//                                     <p class="formBoxTitle"><span class="formNumber">1</span> تفاصيل الإحالة</p>
//                                 </div>
//                                 <div class="formBox">
//                                     <div class="formElements">
//                                         <div class="row">
//                                             <div class="col-md-4">
//                                                 <div class="form-group customFormGroup">
//                                                     <label for="referralNumber" class="customLabel">رقم الإحالة</label>
//                                                     <input class="form-control customInput referralNumber" id="referralNumber" type="text" value="${referralData.ReferralNumber || "----"}" disabled>
//                                                 </div>
//                                             </div>
//                                             <div class="col-md-4">
//                                                 <div class="form-group customFormGroup">
//                                                     <label for="refferedDate" class="customLabel">تاريخ الإحالة</label>
//                                                     <input class="form-control customInput refferedDate" id="refferedDate" type="text" value="${functions.getFormatedDate(referralData.RefferedDate)}" disabled>
//                                                 </div>
//                                             </div>
//                                             <div class="col-md-4">
//                                                 <div class="form-group customFormGroup">
//                                                     <label for="referralStatus" class="customLabel">حالة الإحالة</label>
//                                                     <input class="form-control customInput referralStatus" id="referralStatus" type="text" value="${referralData.Status || "----"}" disabled>
//                                                 </div>
//                                             </div>
//                                             <div class="col-md-4">
//                                                 <div class="form-group customFormGroup">
//                                                     <label for="violationStatus" class="customLabel">حالة المخالفة</label>
//                                                     <input class="form-control customInput violationStatus" id="violationStatus" type="text" value="${quarryViolationReferral.getViolationStatusText(referralData.ViolationStatus)}" disabled>
//                                                 </div>
//                                             </div>
//                                             <div class="col-md-4">
//                                                 <div class="form-group customFormGroup">
//                                                     <label for="caseNumber" class="customLabel">رقم القضية</label>
//                                                     <input class="form-control customInput caseNumber" id="caseNumber" type="text" value="${referralData.CaseNumber || "----"}" disabled>
//                                                 </div>
//                                             </div>
//                                             <div class="col-md-4">
//                                                 <div class="form-group customFormGroup">
//                                                     <label for="taskId" class="customLabel">رقم المهمة</label>
//                                                     <input class="form-control customInput taskId" id="taskId" type="text" value="${referralData.TaskId || "----"}" disabled>
//                                                 </div>
//                                             </div>
//                                             <div class="col-md-12">
//                                                 <div class="form-group customFormGroup">
//                                                     <label for="comments" class="customLabel">ملاحظات</label>
//                                                     <textarea class="form-control customTextArea comments" id="comments" disabled>${referralData.Comments || "----"}</textarea>
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </div>
                                
//                                 <!-- Violation Details Section using DetailsPopup -->
//                                 <div class="popupFormBoxHeader">
//                                     <p class="formBoxTitle"><span class="formNumber">2</span> تفاصيل المخالفة</p>
//                                 </div>
//                                 ${DetailsPopup.quarryDetailsPopupContent(violationData, "إحالات المحاجر")}
//                             </div>
                            
//                             <div class="formButtonsBox">
//                                 <div class="row">
//                                     <div class="col-12">
//                                         <div class="buttonsBox centerButtonsBox">
//                                             <div class="btnStyle cancelBtn popupBtn closeReferralDetailsPopup" id="closeReferralDetailsPopup" data-dismiss="modal" aria-label="Close">إغلاق</div>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>`;

//                 functions.declarePopup(
//                     ["generalPopupStyle", "greenPopup", "detailsPopup"],
//                     popupHtml
//                 );

//                 // Hide all action buttons from DetailsPopup since this is just a view
//                 $(".formButtonsBox .approveViolation, .formButtonsBox .rejectViolation, .formButtonsBox .confirmViolation, .formButtonsBox .editMaterialMinPrice, .formButtonsBox .payPartPrice, .formButtonsBox .payAllPrice").remove();

//                 // Add print functionality
//                 $(".printBtn").on("click", (e) => {
//                     functions.PrintDetails(e);
//                 });

//                 // Add close button functionality
//                 $(".closeReferralDetailsPopup").on("click", function () {
//                     functions.closePopup();
//                 });

//             } else {
//                 functions.warningAlert("لا توجد بيانات للمخالفة");
//             }
//         })
//         .catch((err) => {
//             console.error(err);
//             $(".overlay").removeClass("active");
//             functions.warningAlert("حدث خطأ في جلب تفاصيل الإحالة");
//         });
// };

// quarryViolationReferral.filterQuarryViolationReferrals = (e) => {
//     if (e) e.preventDefault();

//     let ReferralNumber = $("#CaseNumber").val() || "";
//     let CaseStatus = $("#CaseStatus").children("option:selected").val() || "";
//     let RefferedDateFrom = $("#RefferedDateFrom").val() || "";
//     let RefferedDateTo = $("#RefferedDateTo").val() || "";

//     let OffenderType = "Quarry";

//     if (RefferedDateFrom && RefferedDateTo) {
//         let fromDate = moment(RefferedDateFrom, "DD-MM-YYYY");
//         let toDate = moment(RefferedDateTo, "DD-MM-YYYY");

//         if (fromDate.isAfter(toDate)) {
//             functions.warningAlert("تاريخ 'من' يجب أن يكون قبل تاريخ 'إلى'");
//             return;
//         }
//     }

//     $(".PreLoader").addClass("active");
//     quarryViolationReferral.getQuarryViolationReferrals(
//         1,
//         true,
//         ReferralNumber,
//         CaseStatus,
//         OffenderType,
//         RefferedDateFrom,
//         RefferedDateTo
//     );
// };
// //////////////////////////////////////////////
// quarryViolationReferral.initializePaymentFormActions = (ViolationID, TaskID, totalPrice, attachInputSelector) => {
//     let payedPrice = 0;
//     let PositiveDecimalNumbers = /^[+]?([0-9]+(?:[\.][0-9]*)?|\.[0-9]+)$/;
//     let allAttachments;

//     // Input formatting
//     $(".payedPrice").on("keyup", (e) => {
//         $(e.currentTarget).val($(e.currentTarget).val().split(",").join(""));
//         $(e.currentTarget).val($(e.currentTarget).val().replace(/\B(?=(?:\d{3})+(?!\d))/g, ","));
//         payedPrice = $(e.currentTarget).val();
//         payedPrice = payedPrice.replace(/\,/g, "");
//         payedPrice = Number(payedPrice);
//     });

//     $(".payedPrice").on("keypress", (e) => {
//         return functions.isDecimalNumberKey(e);
//     });

//     // Payment button click handler
//     $(`${attachInputSelector === "#payCaseAttachment" ? ".payCaseBeforeEditBtn" : ".payCaseAfterEditBtn"}`).on("click", (e) => {
//         if (!payedPrice || payedPrice <= 0) {
//             functions.warningAlert("من فضلك أدخل مبلغ صحيح");
//             return;
//         }

//         // Check if amount matches the total price
//         if (payedPrice != totalPrice) {
//             functions.warningAlert("المبلغ الذي أدخلته غير مطابق للمبلغ الكامل للقضية");
//             return;
//         }

//         if (allAttachments != null && allAttachments.length > 0) {
//             $(".overlay").addClass("active");

//             // Calculate actual amount paid (remove commas for calculation)
//             let actualAmountPaid = totalPrice.toString().replace(/\,/g, "");

//             // First change task status, then upload attachment in the success callback
//             quarryViolationReferral.changeTaskStatusAfterPayCase(
//                 TaskID,
//                 ViolationID,
//                 attachInputSelector,
//                 parseFloat(actualAmountPaid),
//                 ReferralID
//             );

//         } else {
//             functions.warningAlert("من فضلك قم بإرفاق إيصال السداد");
//         }
//     });
// };
// ///////////////////////////////////////////
// quarryViolationReferral.getViolationStatus = (ViolationStatus) => {
//     let statusHtml = ``;
//     switch (ViolationStatus) {
//         case "Pending":
//         case "Confirmed": {
//             statusHtml = `<div class="statusBox pendingStatus">
//                 <i class="statusIcon fa-regular fa-clock"></i>
//                 <span class="statusText">قيد الانتظار</span>
//             </div>`;
//             break;
//         }
//         case "Exceeded": {
//             statusHtml = `<div class="statusBox warningStatus">
//                 <img class="statusIcon" src="/Style Library/MiningViolations/images/tringleIcon.svg" alt="warning">
//                 <span class="statusText">تجاوز مدة السداد</span>
//             </div>`;
//             break;
//         }
//         case "Saved": {
//             statusHtml = `<div class="statusBox killedStatus">
//                 <i class="statusIcon fa-solid fa-ban"></i> 
//                 <span class="statusText">محفوظة</span>
//             </div>`;
//             break;
//         }
//         case "Paid After Reffered": {
//             statusHtml = `<div class="statusBox closedStatus">
//                 <i class="statusIcon fa-regular fa-circle-check"></i>
//                 <span class="statusText">سداد بعد الإحالة</span>
//             </div>`;
//             break;
//         }
//         case "Paid": {
//             statusHtml = `<div class="statusBox closedStatus">
//                 <i class="statusIcon fa-regular fa-circle-check"></i>
//                 <span class="statusText">مسددة</span>
//             </div>`;
//             break;
//         }
//         case "UnderPayment": {
//             statusHtml = `<div class="statusBox warningStatus">
//                 <img class="statusIcon" src="/Style Library/MiningViolations/images/tringleIcon.svg" alt="warning">
//                 <span class="statusText">قيد السداد</span>
//             </div>`;
//             break;
//         }
//         case "Approved": {
//             statusHtml = `<div class="statusBox closedStatus">
//                 <i class="statusIcon fa-regular fa-circle-check"></i>
//                 <span class="statusText">تم الموافقة</span>
//             </div>`;
//             break;
//         }
//         case "Rejected": {
//             statusHtml = `<div class="statusBox killedStatus">
//                 <i class="statusIcon fa-solid fa-ban"></i> 
//                 <span class="statusText">مرفوضة</span>
//             </div>`;
//             break;
//         }
//         case "Reffered": {
//             statusHtml = `<div class="statusBox pendingStatus">
//                 <i class="statusIcon fa-regular fa-paper-plane"></i>
//                 <span class="statusText">تم الإحالة</span>
//             </div>`;
//             break;
//         }
//         case "UnderReview": {
//             statusHtml = `<div class="statusBox pendingStatus">
//                 <i class="statusIcon fa-regular fa-eye"></i>
//                 <span class="statusText">منظورة</span>
//             </div>`;
//             break;
//         }
//         case "ExternalReviewed": {
//             statusHtml = `<div class="statusBox pendingStatus">
//                 <i class="statusIcon fa-regular fa-external-link"></i>
//                 <span class="statusText">خارجية</span>
//             </div>`;
//             break;
//         }
//         case "Completed": {
//             statusHtml = `<div class="statusBox closedStatus">
//                 <i class="statusIcon fa-regular fa-circle-check"></i>
//                 <span class="statusText">مكتملة</span>
//             </div>`;
//             break;
//         }
//         case "Cancelled": {
//             statusHtml = `<div class="statusBox killedStatus">
//                 <i class="statusIcon fa-solid fa-ban"></i> 
//                 <span class="statusText">ملغاه</span>
//             </div>`;
//             break;
//         }
//         default: {
//             statusHtml = `<div class="statusBox pendingStatus">
//                 <i class="statusIcon fa-regular fa-question-circle"></i>
//                 <span class="statusText">${ViolationStatus || "---"}</span>
//             </div>`;
//             break;
//         }
//     }

//     return statusHtml;
// };
// // quarryViolationReferral.getCaseStatus = (caseStatus) => {
// //     let statusHtml = ``;

// //     switch (caseStatus) {
// //         case "قيد مراجعة النيابة المختصة": {
// //             statusHtml = `<div class="statusBox pendingStatus">
// //                 <i class="statusIcon fa-regular fa-eye"></i>
// //                 <span class="statusText">${caseStatus}</span>
// //             </div>`;
// //             break;
// //         }
// //         case "منظورة": {
// //             statusHtml = `<div class="statusBox pendingStatus">
// //                 <i class="statusIcon fa-regular fa-eye"></i>
// //                 <span class="statusText">${caseStatus}</span>
// //             </div>`;
// //             break;
// //         }
// //         case "مسددة": {
// //             statusHtml = `<div class="statusBox closedStatus">
// //                 <i class="statusIcon fa-regular fa-circle-check"></i>
// //                 <span class="statusText">${caseStatus}</span>
// //             </div>`;
// //             break;
// //         }
// //         case "محفوظة": {
// //             statusHtml = `<div class="statusBox savedStatus"> <!-- Added savedStatus class -->
// //                 <i class="statusIcon fa-solid fa-box-archive"></i>
// //                 <span class="statusText">${caseStatus}</span>
// //             </div>`;
// //             break;
// //         }
// //         case "قيد انتظار القطاع": {
// //             statusHtml = `<div class="statusBox waitingStatus">
// //                 <i class="statusIcon fa-regular fa-clock"></i>
// //                 <span class="statusText">${caseStatus}</span>
// //             </div>`;
// //             break;
// //         }
// //         case "قيد انتظار رقم القضية": {
// //             statusHtml = `<div class="statusBox waitingStatus">
// //                 <i class="statusIcon fa-solid fa-hashtag"></i>
// //                 <span class="statusText">${caseStatus}</span>
// //             </div>`;
// //             break;
// //         }
// //         case "قيد انتظار رقم الإحالة": {
// //             statusHtml = `<div class="statusBox waitingStatus">
// //                 <i class="statusIcon fa-regular fa-paper-plane"></i>
// //                 <span class="statusText">${caseStatus}</span>
// //             </div>`;
// //             break;
// //         }
// //         case "قيد انتظار تأشيرات النيابة": {
// //             statusHtml = `<div class="statusBox waitingStatus">
// //                 <i class="statusIcon fa-solid fa-stamp"></i>
// //                 <span class="statusText">${caseStatus}</span>
// //             </div>`;
// //             break;
// //         }
// //         case "تم التسليم للتحريات": {
// //             statusHtml = `<div class="statusBox deliveredStatus"> <!-- Added deliveredStatus class -->
// //                 <i class="statusIcon fa-solid fa-truck-arrow-right"></i>
// //                 <span class="statusText">${caseStatus}</span>
// //             </div>`;
// //             break;
// //         }
// //         case "قيد انتظار المدعي العام العسكري": {
// //             statusHtml = `<div class="statusBox waitingStatus">
// //                 <i class="statusIcon fa-solid fa-gavel"></i>
// //                 <span class="statusText">${caseStatus}</span>
// //             </div>`;
// //             break;
// //         }
// //         case "قيد انتظار الرقم القضائي": {
// //             statusHtml = `<div class="statusBox waitingStatus">
// //                 <i class="statusIcon fa-solid fa-scale-balanced"></i>
// //                 <span class="statusText">${caseStatus}</span>
// //             </div>`;
// //             break;
// //         }
// //         case "تم إضافة الرقم القضائي": {
// //             statusHtml = `<div class="statusBox completedStatus">
// //                 <i class="statusIcon fa-solid fa-check-double"></i>
// //                 <span class="statusText">${caseStatus}</span>
// //             </div>`;
// //             break;
// //         }
// //         default: {
// //             statusHtml = `<div class="statusBox pendingStatus">
// //                 <i class="statusIcon fa-regular fa-question-circle"></i>
// //                 <span class="statusText">${caseStatus || "---"}</span>
// //             </div>`;
// //             break;
// //         }
// //     }

// //     return statusHtml;
// // };
// ///////////////////////////////////////////


// ///////////////////////////////////////////
// quarryViolationReferral.getReferralDetails = (referralData) => {
//     let violation = referralData.Violation;
//     let violationOffenderType = violation?.OffenderType || "Quarry";
//     let popupTitle;

//     if (referralData.ReferralNumber) {
//         popupTitle = `تفاصيل الإحالة رقم (${referralData.ReferralNumber})`;
//     } else {
//         popupTitle = `تفاصيل الإحالة عن المخالفة رقم (${referralData.ViolationCode})`;
//     }

//     let popupHtml = `
// <div class="caseDetialsPrintBox" id="printJS-form">
//     <div class="popupHeader">
//         <div class="popupTitleBox">
//             <div class="CaseNumberBox">
//                 <p class="caseNumber">${popupTitle}</p>  
//                 <div class="printBtn"><img src="/Style Library/MiningViolations/images/WhitePrintBtn.png" alt="Print Button"></div>
//             </div>
//             <div class="btnStyle cancelBtn popupBtn closeReferralDetailsPopup" id="closeReferralDetailsPopup" style="color: #fff; cursor: pointer;" data-dismiss="modal" aria-label="Close">
//                 <i class="fa-solid fa-x"></i>
//             </div>
//         </div> 
//     </div>
//     <div class="popupBody" style="overflow-y: auto; max-height: 80vh;"> <!-- Added inline styles -->
//         <div class="popupForm detailsPopupForm" id="detailsPopupForm">
//                 <div class="formContent">
//                     <div class="formBox">
//                         <div class="formBoxHeader">
//                             <p class="formBoxTitle"><span class="formNumber">1</span> تفاصيل الإحالة</p>
//                         </div>
//                         <div class="formElements">
//                             <div class="row">
//                                 <div class="col-md-4">
//                                     <div class="form-group customFormGroup">
//                                         <label for="referralNumber" class="customLabel">رقم الإحالة</label>
//                                         <input class="form-control customInput referralNumber" id="referralNumber" type="text" value="${referralData.ReferralNumber || "----"}" disabled>
//                                     </div>
//                                 </div>
//                                 <div class="col-md-4">
//                                     <div class="form-group customFormGroup">
//                                         <label for="refferedDate" class="customLabel">تاريخ الإحالة</label>
//                                         <input class="form-control customInput refferedDate" id="refferedDate" type="text" value="${functions.getFormatedDate(referralData.RefferedDate)}" disabled>
//                                     </div>
//                                 </div>
//                                 <div class="col-md-4">
//                                     <div class="form-group customFormGroup">
//                                         <label for="referralStatus" class="customLabel">حالة الإحالة</label>
//                                         <input class="form-control customInput referralStatus" id="referralStatus" type="text" value="${referralData.Status || "----"}" disabled>
//                                     </div>
//                                 </div>
//                                 <div class="col-md-4">
//                                     <div class="form-group customFormGroup">
//                                         <label for="violationStatus" class="customLabel">حالة المخالفة</label>
//                                         <input class="form-control customInput violationStatus" id="violationStatus" type="text" value="${quarryViolationReferral.getViolationStatusText(referralData.ViolationStatus)}" disabled>
//                                     </div>
//                                 </div>
//                                 <div class="col-md-4">
//                                     <div class="form-group customFormGroup">
//                                         <label for="caseNumber" class="customLabel">رقم القضية</label>
//                                         <input class="form-control customInput caseNumber" id="caseNumber" type="text" value="${referralData.CaseNumber || "----"}" disabled>
//                                     </div>
//                                 </div>
//                                 <div class="col-md-4">
//                                     <div class="form-group customFormGroup">
//                                         <label for="taskId" class="customLabel">رقم المهمة</label>
//                                         <input class="form-control customInput taskId" id="taskId" type="text" value="${referralData.TaskId || "----"}" disabled>
//                                     </div>
//                                 </div>
//                                 <div class="col-md-12">
//                                     <div class="form-group customFormGroup">
//                                         <label for="comments" class="customLabel">ملاحظات</label>
//                                         <textarea class="form-control customTextArea comments" id="comments" disabled>${referralData.Comments || "----"}</textarea>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 <div class="formContent">
//                     <div class="formBox">
//                         <div class="formBoxHeader">
//                             <p class="formBoxTitle"><span class="formNumber">2</span> تفاصيل المخالفة</p>
//                         </div>
//                         <div class="formElements">
//                             <div class="row">
//                                 ${violationOffenderType == "Quarry"
//             ? quarryViolationReferral.referralQuarryDetails(violation)
//             : violationOffenderType == "Vehicle"
//                 ? quarryViolationReferral.referralVehicleDetails(violation)
//                 : quarryViolationReferral.referralEquipmentDetails(violation)
//         }
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 <div class="formButtonsBox">
//                     <div class="row">
//                         <div class="col-12">
//                             <div class="buttonsBox centerButtonsBox ">
//                                 <div class="btnStyle cancelBtn popupBtn closeDetailsPopup" id="closeDetailsPopup" data-dismiss="modal" aria-label="Close">إغلاق</div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//             </div>
//         </div>
//     </div>`;

//     return popupHtml;
// };
// quarryViolationReferral.getViolationStatusText = (status) => {
//     const statusMap = {
//         "Pending": "قيد الانتظار",
//         "Confirmed": "مؤكدة",
//         "Exceeded": "تجاوز مدة السداد",
//         "Saved": "محفوظة",
//         "Paid": "مسددة",
//         "Paid After Reffered": "سداد بعد الإحالة",
//         "UnderPayment": "قيد السداد",
//         "Approved": "تم الموافقة",
//         "Rejected": "مرفوضة",
//         "Reffered": "تم الإحالة",
//         "UnderReview": "منظورة",
//         "ExternalReviewed": "خارجية",
//         "Completed": "مكتملة",
//         "Cancelled": "ملغاه"
//     };

//     return statusMap[status] || status || "----";
// };
// quarryViolationReferral.referralQuarryDetails = (violationData) => {
//     let detailsHtml = `
//         <div class="col-md-4">
//             <div class="form-group customFormGroup">
//                 <label for="violationCode" class="customLabel">رقم المخالفة</label>
//                 <input class="form-control customInput violationCode" id="violationCode" type="text" value="${violationData.ViolationCode || "----"}" disabled>
//             </div>
//         </div>
//         <div class="col-md-4">
//             <div class="form-group customFormGroup">
//                 <label for="violatorName" class="customLabel">اسم المخالف</label>
//                 <input class="form-control customInput violatorName" id="violatorName" type="text" value="${violationData.ViolatorName || "----"}" disabled>
//             </div>
//         </div>
//         <div class="col-md-4">
//             <div class="form-group customFormGroup">
//                 <label for="violatorCompany" class="customLabel">الشركة المخالفة التابع لها</label>
//                 <input class="form-control customInput violatorCompany" id="violatorCompany" type="text" value="${violationData.ViolatorCompany || "----"}" disabled>
//             </div>
//         </div>
//         <div class="col-md-4">
//             <div class="form-group customFormGroup">
//                 <label for="violationType" class="customLabel">نوع المخالفة</label>
//                 <input class="form-control customInput violationType" id="violationType" type="text" value="${violationData.ViolationTypes?.Title || "----"}" disabled>
//             </div>
//         </div>
//         <div class="col-md-4">
//             <div class="form-group customFormGroup">
//                 <label for="materialType" class="customLabel">نوع الخام</label>
//                 <input class="form-control customInput materialType" id="materialType" type="text" value="${violationData.Material?.Title || "----"}" disabled>
//             </div>
//         </div>
//         <div class="col-md-4">
//             <div class="form-group customFormGroup">
//                 <label for="violationGov" class="customLabel">المحافظة</label>
//                 <input class="form-control customInput violationGov" id="violationGov" type="text" value="${violationData.Governrates?.Title || "----"}" disabled>
//             </div>
//         </div>
//         <div class="col-md-4">
//             <div class="form-group customFormGroup">
//                 <label for="violationZone" class="customLabel">منطقة الضبط</label>
//                 <input class="form-control customInput violationZone" id="violationZone" type="text" value="${violationData.ViolationsZone || "----"}" disabled>
//             </div>
//         </div>
//         <div class="col-md-4">
//             <div class="form-group customFormGroup">
//                 <label for="violationDate" class="customLabel">تاريخ الضبط</label>
//                 <input class="form-control customInput violationDate" id="violationDate" type="text" value="${functions.getFormatedDate(violationData.ViolationDate)}" disabled>
//             </div>
//         </div>
//         <div class="col-md-4">
//             <div class="form-group customFormGroup">
//                 <label for="violationTime" class="customLabel">وقت الضبط</label>
//                 <input class="form-control customInput violationTime" id="violationTime" type="text" value="${functions.getFormatedDate(violationData.ViolationTime, "hh:mm A")}" disabled>
//             </div>
//         </div>
//         <div class="col-md-4">
//             <div class="form-group customFormGroup">
//                 <label for="totalOldPrice" class="customLabel">المبلغ القديم</label>
//                 <input class="form-control customInput totalOldPrice" id="totalOldPrice" type="text" value="${functions.splitBigNumbersByComma(violationData.TotalOldPrice || 0)}" disabled>
//             </div>
//         </div>
//         <div class="col-md-4">
//             <div class="form-group customFormGroup">
//                 <label for="totalPriceDue" class="customLabel">المبلغ المستحق</label>
//                 <input class="form-control customInput totalPriceDue" id="totalPriceDue" type="text" value="${functions.splitBigNumbersByComma(violationData.TotalPriceDue || 0)}" disabled>
//             </div>
//         </div>
//         <div class="col-md-4">
//             <div class="form-group customFormGroup">
//                 <label for="quarryCode" class="customLabel">رقم المحجر</label>
//                 <input class="form-control customInput quarryCode" id="quarryCode" type="text" value="${violationData.QuarryCode || "----"}" disabled>
//             </div>
//         </div>
//         <div class="col-md-4">
//             <div class="form-group customFormGroup">
//                 <label for="quarryType" class="customLabel">نوع المحجر</label>
//                 <input class="form-control customInput quarryType" id="quarryType" type="text" value="${violationData.QuarryType || "----"}" disabled>
//             </div>
//         </div>
//     `;
//     return detailsHtml;
// };
// quarryViolationReferral.referralVehicleDetails = (violationData) => {
//     let detailsHtml = `
//         <div class="col-md-4">
//             <div class="form-group customFormGroup">
//                 <label for="violationCode" class="customLabel">رقم المخالفة</label>
//                 <input class="form-control customInput violationCode" id="violationCode" type="text" value="${violationData.ViolationCode || "----"}" disabled>
//             </div>
//         </div>
//         <div class="col-md-4">
//             <div class="form-group customFormGroup">
//                 <label for="violatorName" class="customLabel">اسم المخالف</label>
//                 <input class="form-control customInput violatorName" id="violatorName" type="text" value="${violationData.ViolatorName || "----"}" disabled>
//             </div>
//         </div>
//         <div class="col-md-4">
//             <div class="form-group customFormGroup">
//                 <label for="violatorCompany" class="customLabel">الشركة المخالفة التابع لها</label>
//                 <input class="form-control customInput violatorCompany" id="violatorCompany" type="text" value="${violationData.ViolatorCompany || "----"}" disabled>
//             </div>
//         </div>
//         <div class="col-md-4">
//             <div class="form-group customFormGroup">
//                 <label for="violationType" class="customLabel">نوع المخالفة</label>
//                 <input class="form-control customInput violationType" id="violationType" type="text" value="${violationData.ViolationTypes?.Title || "----"}" disabled>
//             </div>
//         </div>
//         <div class="col-md-4">
//             <div class="form-group customFormGroup">
//                 <label for="materialType" class="customLabel">نوع الخام</label>
//                 <input class="form-control customInput materialType" id="materialType" type="text" value="${violationData.Material?.Title || "----"}" disabled>
//             </div>
//         </div>
//         <div class="col-md-4">
//             <div class="form-group customFormGroup">
//                 <label for="violationGov" class="customLabel">المحافظة</label>
//                 <input class="form-control customInput violationGov" id="violationGov" type="text" value="${violationData.Governrates?.Title || "----"}" disabled>
//             </div>
//         </div>
//         <div class="col-md-4">
//             <div class="form-group customFormGroup">
//                 <label for="violationZone" class="customLabel">منطقة الضبط</label>
//                 <input class="form-control customInput violationZone" id="violationZone" type="text" value="${violationData.ViolationsZone || "----"}" disabled>
//             </div>
//         </div>
//         <div class="col-md-4">
//             <div class="form-group customFormGroup">
//                 <label for="violationDate" class="customLabel">تاريخ الضبط</label>
//                 <input class="form-control customInput violationDate" id="violationDate" type="text" value="${functions.getFormatedDate(violationData.ViolationDate)}" disabled>
//             </div>
//         </div>
//         <div class="col-md-4">
//             <div class="form-group customFormGroup">
//                 <label for="violationTime" class="customLabel">وقت الضبط</label>
//                 <input class="form-control customInput violationTime" id="violationTime" type="text" value="${functions.getFormatedDate(violationData.ViolationTime, "hh:mm A")}" disabled>
//             </div>
//         </div>
//         <div class="col-md-4">
//             <div class="form-group customFormGroup">
//                 <label for="totalOldPrice" class="customLabel">المبلغ القديم</label>
//                 <input class="form-control customInput totalOldPrice" id="totalOldPrice" type="text" value="${functions.splitBigNumbersByComma(violationData.TotalOldPrice || 0)}" disabled>
//             </div>
//         </div>
//         <div class="col-md-4">
//             <div class="form-group customFormGroup">
//                 <label for="totalPriceDue" class="customLabel">المبلغ المستحق</label>
//                 <input class="form-control customInput totalPriceDue" id="totalPriceDue" type="text" value="${functions.splitBigNumbersByComma(violationData.TotalPriceDue || 0)}" disabled>
//             </div>
//         </div>
//         <div class="col-md-4">
//             <div class="form-group customFormGroup">
//                 <label for="carNumber" class="customLabel">رقم العربة</label>
//                 <input class="form-control customInput carNumber" id="carNumber" type="text" value="${violationData.CarNumber || "----"}" disabled>
//             </div>
//         </div>
//         <div class="col-md-4">
//             <div class="form-group customFormGroup">
//                 <label for="vehicleType" class="customLabel">نوع العربة</label>
//                                 <input class="form-control customInput vehicleType" id="vehicleType" type="text" value="${violationData.VehicleType || "----"}" disabled>
//             </div>
//         </div>
//     `;
//     return detailsHtml;
// };
// quarryViolationReferral.referralEquipmentDetails = (violationData) => {
//     let detailsHtml = `
//         <div class="col-md-4">
//             <div class="form-group customFormGroup">
//                 <label for="violationCode" class="customLabel">رقم المخالفة</label>
//                 <input class="form-control customInput violationCode" id="violationCode" type="text" value="${violationData.ViolationCode || "----"}" disabled>
//             </div>
//         </div>
//         <div class="col-md-4">
//             <div class="form-group customFormGroup">
//                 <label for="violatorName" class="customLabel">اسم المخالف</label>
//                 <input class="form-control customInput violatorName" id="violatorName" type="text" value="${violationData.ViolatorName || "----"}" disabled>
//             </div>
//         </div>
//         <div class="col-md-4">
//             <div class="form-group customFormGroup">
//                 <label for="violatorCompany" class="customLabel">الشركة المخالفة التابع لها</label>
//                 <input class="form-control customInput violatorCompany" id="violatorCompany" type="text" value="${violationData.ViolatorCompany || "----"}" disabled>
//             </div>
//         </div>
//         <div class="col-md-4">
//             <div class="form-group customFormGroup">
//                 <label for="violationType" class="customLabel">نوع المخالفة</label>
//                 <input class="form-control customInput violationType" id="violationType" type="text" value="${violationData.ViolationTypes?.Title || "----"}" disabled>
//             </div>
//         </div>
//         <div class="col-md-4">
//             <div class="form-group customFormGroup">
//                 <label for="materialType" class="customLabel">نوع الخام</label>
//                 <input class="form-control customInput materialType" id="materialType" type="text" value="${violationData.Material?.Title || "----"}" disabled>
//             </div>
//         </div>
//         <div class="col-md-4">
//             <div class="form-group customFormGroup">
//                 <label for="violationGov" class="customLabel">المحافظة</label>
//                 <input class="form-control customInput violationGov" id="violationGov" type="text" value="${violationData.Governrates?.Title || "----"}" disabled>
//             </div>
//         </div>
//         <div class="col-md-4">
//             <div class="form-group customFormGroup">
//                 <label for="violationZone" class="customLabel">منطقة الضبط</label>
//                 <input class="form-control customInput violationZone" id="violationZone" type="text" value="${violationData.ViolationsZone || "----"}" disabled>
//             </div>
//         </div>
//         <div class="col-md-4">
//             <div class="form-group customFormGroup">
//                 <label for="violationDate" class="customLabel">تاريخ الضبط</label>
//                 <input class="form-control customInput violationDate" id="violationDate" type="text" value="${functions.getFormatedDate(violationData.ViolationDate)}" disabled>
//             </div>
//         </div>
//         <div class="col-md-4">
//             <div class="form-group customFormGroup">
//                 <label for="violationTime" class="customLabel">وقت الضبط</label>
//                 <input class="form-control customInput violationTime" id="violationTime" type="text" value="${functions.getFormatedDate(violationData.ViolationTime, "hh:mm A")}" disabled>
//             </div>
//         </div>
//         <div class="col-md-4">
//             <div class="form-group customFormGroup">
//                 <label for="totalOldPrice" class="customLabel">المبلغ القديم</label>
//                 <input class="form-control customInput totalOldPrice" id="totalOldPrice" type="text" value="${functions.splitBigNumbersByComma(violationData.TotalOldPrice || 0)}" disabled>
//             </div>
//         </div>
//         <div class="col-md-4">
//             <div class="form-group customFormGroup">
//                 <label for="totalPriceDue" class="customLabel">المبلغ المستحق</label>
//                 <input class="form-control customInput totalPriceDue" id="totalPriceDue" type="text" value="${functions.splitBigNumbersByComma(violationData.TotalPriceDue || 0)}" disabled>
//             </div>
//         </div>
//         <div class="col-md-4">
//             <div class="form-group customFormGroup">
//                 <label for="equipmentType" class="customLabel">نوع المعدة</label>
//                 <input class="form-control customInput equipmentType" id="equipmentType" type="text" value="${violationData.EquipmentType || "----"}" disabled>
//             </div>
//         </div>
//     `;
//     return detailsHtml;
// };
// ////////////////////////////////////////////////

// ////////////////////////////////////////////////////
// quarryViolationReferral.payCaseBeforeEditPopup = (
//     ReferralID,
//     ViolationID,
//     TaskID,
//     referralNumber,
//     violationCode,
//     totalPrice
// ) => {
//     $(".overlay").removeClass("active");

//     // Get violation details first
//     let request = {
//         Id: ViolationID,
//     };

//     functions
//         .requester(
//             "/_layouts/15/Uranium.Violations.SharePoint/Violations.aspx/FindbyId",
//             request
//         )
//         .then((response) => {
//             if (response.ok) {
//                 return response.json();
//             }
//         })
//         .then((data) => {
//             if (data.d) {
//                 let violationData = data.d;

//                 // Build popup with DetailsPopup component
//                 let popupHtml = `
//                     <div class="popupHeader">
//                         <div class="violationsCode"> 
//                             <p>سداد على نموذج التقييم - الإحالة رقم (${referralNumber})</p>
//                         </div>
//                     </div>
//                     <div class="popupBody">
//                         <div class="popupForm detailsPopupForm" id="detailsPopupForm">
//                             <div class="formContent">
//                                 ${DetailsPopup.quarryDetailsPopupContent(violationData, "إحالات المحاجر")}
//                             </div>
                            
//                             <!-- Payment form section -->
//                             <div class="paymentFormBody" style="margin-top: 30px;">
//                                 <div class="popupForm paymentForm" id="paymentForm" 
//                                         data-taskid="${TaskID}" 
//                                         data-violationid="${ViolationID}" 
//                                         data-actualprice="${violationData?.ActualAmountPaid || 0}" 
//                                         data-lawroyalty="${violationData?.LawRoyalty || 0}" 
//                                         data-totalequipmentsprice="${violationData?.TotalEquipmentsPrice || 0}" 
//                                         data-totalprice="${totalPrice}" 
//                                         data-offendertype="${violationData?.OffenderType}" 
//                                         data-violationpricetype="${violationData?.ViolationTypes?.PriceType || 0}" 
//                                         data-totalinstallmentspaidamount="${violationData?.TotalInstallmentsPaidAmount || 0}">
//                                     <div class="popupFormBoxHeader">
//                                         <p class="formBoxTitle"><span class="formNumber">2</span> سداد على نموذج التقييم</p>
//                                     </div>
//                                     <div class="formContent">
//                                         <div class="formBox">
//                                             <div class="formElements">
//                                                 <div class="row">
//                                                     <div class="col-md-6">
//                                                         <div class="form-group customFormGroup">
//                                                             <label for="violationCasePrice" class="customLabel">المبلغ المطلوب سداده</label>
//                                                             <input class="form-control disabled customInput violationCasePrice" id="violationCasePrice" type="text" value="${functions.splitBigNumbersByComma(totalPrice)}" disabled>
//                                                         </div>
//                                                     </div>
//                                                     <div class="col-md-6">
//                                                         <div class="form-group customFormGroup">
//                                                             <div class="feildInfoBox">
//                                                                 <label for="payedPrice" class="customLabel">المبلغ المراد تسديده *</label>
//                                                                 <span class="metaDataSpan">بالجنيه المصري</span>
//                                                             </div>
//                                                             <input class="form-control customInput payedPrice greenCustomInput" id="payedPrice" type="text" placeholder="ادخل المبلغ المراد تسديده">
//                                                         </div>
//                                                     </div>
//                                                     <div class="col-12">
//                                                         <div class="form-group customFormGroup">
//                                                             <label for="payCaseAttachment" class="customLabel">إرفاق إيصال السداد</label>
//                                                             <div class="fileBox" id="dropContainer">
//                                                                 <div class="inputFileBox">
//                                                                     <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
//                                                                     <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
//                                                                     <input type="file" class="customInput attachFilesInput payCaseAttachment form-control" id="payCaseAttachment" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx" multiple>
//                                                                 </div>
//                                                             </div>
//                                                             <div class="dropFilesArea" id="dropFilesArea"></div>
//                                                         </div>
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     </div>

//                                     <div class="formButtonsBox">
//                                         <div class="row">
//                                             <div class="col-12">
//                                                 <div class="buttonsBox centerButtonsBox">
//                                                     <div class="btnStyle confirmBtnGreen popupBtn payCaseBeforeEditBtn" id="payCaseBeforeEditBtn">تأكيد السداد</div>
//                                                     <div class="btnStyle cancelBtn popupBtn closePayCasePopup" id="closePayCasePopup" data-dismiss="modal" aria-label="Close">إلغاء</div>
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>`;

//                 functions.declarePopup(
//                     ["generalPopupStyle", "greenPopup", "detailsPopup"],
//                     popupHtml
//                 );

//                 // Initialize the payment form actions
//                 quarryViolationReferral.initializePaymentFormActions(ViolationID, TaskID, totalPrice, "#payCaseAttachment");

//                 // Hide unnecessary buttons from DetailsPopup
//                 $(".formButtonsBox .approveViolation, .formButtonsBox .rejectViolation, .formButtonsBox .confirmViolation, .formButtonsBox .editMaterialMinPrice, .formButtonsBox .payPartPrice, .formButtonsBox .payAllPrice").remove();

//                 // Setup file attachment handling
//                 quarryViolationReferral.setupFileAttachmentHandling("#payCaseAttachment");

//             } else {
//                 functions.warningAlert("لا توجد بيانات للمخالفة");
//             }
//         })
//         .catch((err) => {
//             console.error("Error fetching violation details:", err);
//             functions.warningAlert("حدث خطأ في جلب تفاصيل المخالفة");
//         });
// };
// quarryViolationReferral.payCaseAfterEditPopup = (
//     ReferralID,
//     ViolationID,
//     TaskID,
//     referralNumber,
//     violationCode,
//     totalPrice,
//     oldPrice,
//     referredAmount
// ) => {
//     $(".overlay").removeClass("active");

//     // Get violation details first
//     let request = {
//         Id: ViolationID,
//     };

//     functions
//         .requester(
//             "/_layouts/15/Uranium.Violations.SharePoint/Violations.aspx/FindbyId",
//             request
//         )
//         .then((response) => {
//             if (response.ok) {
//                 return response.json();
//             }
//         })
//         .then((data) => {
//             if (data.d) {
//                 let violationData = data.d;

//                 // Build popup with DetailsPopup component
//                 let popupHtml = `
//                     <div class="popupHeader">
//                         <div class="violationsCode"> 
//                             <p>سداد على الإحالة - الإحالة رقم (${referralNumber})</p>
//                         </div>
//                     </div>
//                     <div class="popupBody">
//                         <div class="popupForm detailsPopupForm" id="detailsPopupForm">
//                             <div class="formContent">
//                                 ${DetailsPopup.quarryDetailsPopupContent(violationData, "إحالات المحاجر")}
//                             </div>
                            
//                             <!-- Payment form section -->
//                             <div class="paymentFormBody" style="margin-top: 30px;">
//                                 <div class="popupForm paymentForm" id="paymentForm" 
//                                         data-taskid="${TaskID}" 
//                                         data-violationid="${ViolationID}" 
//                                         data-actualprice="${violationData?.ActualAmountPaid || 0}" 
//                                         data-lawroyalty="${violationData?.LawRoyalty || 0}" 
//                                         data-totalequipmentsprice="${violationData?.TotalEquipmentsPrice || 0}" 
//                                         data-totalprice="${totalPrice}" 
//                                         data-offendertype="${violationData?.OffenderType}" 
//                                         data-violationpricetype="${violationData?.ViolationTypes?.PriceType || 0}" 
//                                         data-totalinstallmentspaidamount="${violationData?.TotalInstallmentsPaidAmount || 0}">
//                                     <div class="popupFormBoxHeader">
//                                         <p class="formBoxTitle"><span class="formNumber">2</span> سداد على الإحالة</p>
//                                     </div>
//                                     <div class="formContent">
//                                         <div class="formBox">
//                                             <div class="formElements">
//                                                 <div class="row">
//                                                     <div class="col-md-4">
//                                                         <div class="form-group customFormGroup">
//                                                             <label for="violationOldPrice" class="customLabel">المبلغ القديم للمخالفة</label>
//                                                             <input class="form-control disabled customInput violationOldPrice" id="violationOldPrice" type="text" value="${functions.splitBigNumbersByComma(oldPrice)}" disabled>
//                                                         </div>
//                                                     </div>
//                                                     <div class="col-md-4">
//                                                         <div class="form-group customFormGroup">
//                                                             <label for="referredAmountValue" class="customLabel">مبلغ الإحالة المطلوب</label>
//                                                             <input class="form-control disabled customInput referredAmountValue" id="referredAmountValue" type="text" value="${functions.splitBigNumbersByComma(referredAmount)}" disabled>
//                                                         </div>
//                                                     </div>
//                                                     <div class="col-md-4">
//                                                         <div class="form-group customFormGroup">
//                                                             <label for="violationCasePrice" class="customLabel">المبلغ الكلي المطلوب سداده</label>
//                                                             <input class="form-control disabled customInput violationCasePrice" id="violationCasePrice" type="text" value="${functions.splitBigNumbersByComma(totalPrice)}" disabled>
//                                                         </div>
//                                                     </div>
//                                                     <div class="col-md-6">
//                                                         <div class="form-group customFormGroup">
//                                                             <div class="feildInfoBox">
//                                                                 <label for="payedPrice" class="customLabel">المبلغ المراد تسديده *</label>
//                                                                 <span class="metaDataSpan">بالجنيه المصري</span>
//                                                             </div>
//                                                             <input class="form-control customInput payedPrice greenCustomInput" id="payedPrice" type="text" placeholder="ادخل المبلغ المراد تسديده">
//                                                         </div>
//                                                     </div>
//                                                     <div class="col-12">
//                                                         <div class="form-group customFormGroup">
//                                                             <label for="payCaseAfterEditAttachment" class="customLabel">إرفاق إيصال السداد</label>
//                                                             <div class="fileBox" id="dropContainer">
//                                                                 <div class="inputFileBox">
//                                                                     <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
//                                                                     <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
//                                                                     <input type="file" class="customInput attachFilesInput payCaseAfterEditAttachment form-control" id="payCaseAfterEditAttachment" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx" multiple>
//                                                                 </div>
//                                                             </div>
//                                                             <div class="dropFilesArea" id="dropFilesArea"></div>
//                                                         </div>
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     </div>

//                                     <div class="formButtonsBox">
//                                         <div class="row">
//                                             <div class="col-12">
//                                                 <div class="buttonsBox centerButtonsBox">
//                                                     <div class="btnStyle confirmBtnGreen popupBtn payCaseAfterEditBtn" id="payCaseAfterEditBtn">تأكيد السداد</div>
//                                                     <div class="btnStyle cancelBtn popupBtn closePayCasePopup" id="closePayCasePopup" data-dismiss="modal" aria-label="Close">إلغاء</div>
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>`;

//                 functions.declarePopup(
//                     ["generalPopupStyle", "greenPopup", "detailsPopup"],
//                     popupHtml
//                 );

//                 // Initialize the payment form actions
//                 quarryViolationReferral.initializePaymentFormActions(ViolationID, TaskID, totalPrice, "#payCaseAfterEditAttachment");

//                 // Hide unnecessary buttons from DetailsPopup
//                 $(".formButtonsBox .approveViolation, .formButtonsBox .rejectViolation, .formButtonsBox .confirmViolation, .formButtonsBox .editMaterialMinPrice, .formButtonsBox .payPartPrice, .formButtonsBox .payAllPrice").remove();

//                 // Setup file attachment handling
//                 quarryViolationReferral.setupFileAttachmentHandling("#payCaseAfterEditAttachment");

//             } else {
//                 functions.warningAlert("لا توجد بيانات للمخالفة");
//             }
//         })
//         .catch((err) => {
//             console.error("Error fetching violation details:", err);
//             functions.warningAlert("حدث خطأ في جلب تفاصيل المخالفة");
//         });
// };
// quarryViolationReferral.changeTaskStatusAfterPayCase = (TaskID, ViolationID, attachInput, ActualAmountPaid, ReferralID) => {
//     let request = {
//         request: {
//             Data: {
//                 ID: TaskID,
//                 ViolationId: ViolationID,
//                 ActualAmountPaid: ActualAmountPaid,
//                 Status: "Paid"
//             }
//         }
//     };

//     functions
//         .requester("/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Save", request)
//         .then((response) => {
//             if (response.ok) {
//                 return response.json();
//             }
//         })
//         .then((data) => {
//             if (data.d && data.d.Status) {
//                 // After successfully updating task status, upload the attachment
//                 quarryViolationReferral.uploadTaskAttachment(TaskID, attachInput);
//             } else {
//                 functions.warningAlert("حدث خطأ أثناء تحديث حالة المهمة");
//                 $(".overlay").removeClass("active");
//             }
//         })
//         .catch((err) => {
//             console.error("Error updating task status:", err);
//             $(".overlay").removeClass("active");
//             functions.warningAlert("حدث خطأ أثناء عملية السداد");
//         });
// };
// quarryViolationReferral.uploadTaskAttachment = (TaskId, attachInput, ListName = "ViolationsCycle") => {
//     let Data = new FormData();
//     Data.append("itemId", TaskId);
//     Data.append("listName", ListName);

//     // Use the exact same pattern as runningSectorTask
//     let filesInput = $(attachInput)[0];
//     for (let i = 0; i <= filesInput.files.length; i++) {
//         Data.append("file" + i, filesInput.files[i]);
//     }

//     $.ajax({
//         type: "POST",
//         url: "/_layouts/15/Uranium.Violations.SharePoint/Attachments.aspx/Upload",
//         processData: false,
//         contentType: false,
//         data: Data,
//         success: (data) => {
//             $(".overlay").removeClass("active");
//             functions.sucessAlert("تم السداد بنجاح");
//             functions.closePopup();

//             // Refresh the table
//             quarryViolationReferral.getQuarryViolationReferrals(
//                 quarryViolationReferral.pageIndex,
//                 true
//             );
//         },
//         error: (err) => {
//             functions.warningAlert("خطأ في إرسال البيانات لقاعدة البيانات");
//             $(".overlay").removeClass("active");
//             console.log(err.responseText);
//         },
//     });
// };
// ///////////////////////////////////////////////////
// quarryViolationReferral.setupFileAttachmentHandling = (attachInputSelector) => {
//     let filesExtension = [
//         "gif", "svg", "jpg", "jpeg", "png",
//         "doc", "docx", "pdf", "xls", "xlsx", "pptx"
//     ];
//     let allAttachments;
//     let countOfFiles;

//     // File attachment handling
//     $(attachInputSelector).on("change", (e) => {
//         allAttachments = $(e.currentTarget)[0].files;
//         if (allAttachments.length > 0) {
//             $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").show().empty();
//         }
//         for (let i = 0; i < allAttachments.length; i++) {
//             $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").append(`
//                 <div class="file">
//                     <p class="fileName">${allAttachments[i].name}</p>
//                     <span class="deleteFile" data-index="${i}"><i class="fa-sharp fa-solid fa-x"></i></span>
//                 </div>
//             `);
//         }

//         $(".deleteFile").on("click", (event) => {
//             let index = $(event.currentTarget).closest(".file").index();
//             $(event.currentTarget).closest(".file").remove();
//             let fileBuffer = new DataTransfer();
//             for (let i = 0; i < allAttachments.length; i++) {
//                 if (index !== i) {
//                     fileBuffer.items.add(allAttachments[i]);
//                 }
//             }
//             allAttachments = fileBuffer.files;
//             countOfFiles = allAttachments.length;
//             if (countOfFiles == 0) {
//                 $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
//             }
//         });

//         for (let i = 0; i < allAttachments.length; i++) {
//             let fileSplited = allAttachments[i].name.split(".");
//             let fileExt = fileSplited[fileSplited.length - 1].toLowerCase();
//             if ($.inArray(fileExt, filesExtension) == -1) {
//                 functions.warningAlert("من فضلك أدخل الملفات بالامتدادات المسموح بها فقط");
//                 $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
//                 $(e.currentTarget).val("");
//             }
//         }
//     });
// };
// /////////////////////////////////////////////////
// quarryViolationReferral.init = () => {
//     quarryViolationReferral.pageIndex = 1;
//     quarryViolationReferral.dataObj.destroyTable = false;

//     // Setup event listeners
//     $(".searchBtn").off("click").on("click", quarryViolationReferral.filterQuarryViolationReferrals);

//     // ADDED: Reset button handler
//     $(".resetBtn").off("click").on("click", quarryViolationReferral.resetFilter);

//     $(".filterBox input").off("keypress").on("keypress", function (e) {
//         if (e.which === 13) {
//             quarryViolationReferral.filterQuarryViolationReferrals(e);
//         }
//     });

//     // Load initial data
//     $(".PreLoader").addClass("active");
//     quarryViolationReferral.getQuarryViolationReferrals();
// };

// // Also update the filter function to check for empty filters similar to validatedViolations
// quarryViolationReferral.filterQuarryViolationReferrals = (e) => {
//     e.preventDefault();

//     let ReferralNumber = $("#CaseNumber").val();
//     let CaseStatus = $("#CaseStatus").val();
//     let RefferedDateFrom = $("#RefferedDateFrom").val();
//     let RefferedDateTo = $("#RefferedDateTo").val();

//     // Check if all filter fields are empty (similar to validatedViolations validation)
//     if (
//         ReferralNumber === "" &&
//         CaseStatus === "" &&
//         RefferedDateFrom === "" &&
//         RefferedDateTo === ""
//     ) {
//         functions.warningAlert("من فضلك قم بإدخال قيمة واحدة على الأقل من قيم البحث");
//     } else {
//         $(".PreLoader").addClass("active");
//         pagination.reset();
//         quarryViolationReferral.dataObj.destroyTable = true;
//         quarryViolationReferral.getQuarryViolationReferrals(
//             1,
//             true,
//             ReferralNumber,
//             CaseStatus,
//             "Quarry",
//             RefferedDateFrom,
//             RefferedDateTo
//         );
//     }
// };

// $(document).ready(function () {
//     if (functions.getPageName() === "QuarryViolationReferralLog") {
//         quarryViolationReferral.init();
//     }
// });

// export default quarryViolationReferral;


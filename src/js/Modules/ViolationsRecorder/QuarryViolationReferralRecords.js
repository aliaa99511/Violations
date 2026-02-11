import functions from "../../Shared/functions";
import pagination from "../../Shared/Pagination";

let quarryViolationReferralRecords = {
    dataObj: {
        destroyTable: false,
    },
};
quarryViolationReferralRecords.pageIndex = 1;

quarryViolationReferralRecords.getQuarryViolationReferralsRecords = (
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

            quarryViolationReferralRecords.setPaginations(totalPages, rowsPerPage);
            quarryViolationReferralRecords.QuarryViolationReferralRecordsTable(
                Referrals,
                destroyTable || quarryViolationReferralRecords.dataObj.destroyTable
            );
            quarryViolationReferralRecords.pageIndex = currentPage;
        })
        .catch((err) => {
            console.error("API Error:", err);
            $(".PreLoader").removeClass("active");
            functions.warningAlert("حدث خطأ في تحميل البيانات");
        });
};

quarryViolationReferralRecords.setPaginations = (TotalPages, RowsPerPage) => {
    pagination.draw("#paginationID", TotalPages, RowsPerPage);
    pagination.start("#paginationID", quarryViolationReferralRecords.getQuarryViolationReferralsRecords);
    pagination.activateCurrentPage();
};

quarryViolationReferralRecords.QuarryViolationReferralRecordsTable = (Referrals, destroyTable = false) => {
    let data = [];

    if (Referrals && Referrals.length > 0) {
        Referrals.forEach((referral) => {
            let violation = referral?.Violation;
            let refferedDate = functions.getFormatedDate(referral.RefferedDate);
            let violationStatus = referral.ViolationStatus || "";
            let caseStatus = referral.Status || "";
            let referralNumber = referral.ReferralNumber || "";
            let caseNumber = referral.CaseNumber || "";

            // Determine which actions to show based on business rules
            let hasAttachEndorsementAction = false;

            // Business Rule: Attach Endorsement
            // Condition: ReferralNumber is not empty AND Status is "قيد الانتظار القطاع" OR "قيد انتظار تأشيرات النيابة" AND ViolationStatus is "UnderReview"
            if (referralNumber &&
                (caseStatus == "قيد الانتظار القطاع" || caseStatus == "قيد انتظار تأشيرات النيابة") &&
                violationStatus == "UnderReview") {
                hasAttachEndorsementAction = true;
            }

            // Build actions menu HTML
            let actionsMenuHTML = `
                <ul class='list-unstyled controlsList'>
                    <li><a href="#" class="itemDetails">المزيد من التفاصيل</a></li>`;

            if (hasAttachEndorsementAction) {
                actionsMenuHTML += `
                    <li><a href="#" class="attachEndorsementAction" 
                           data-referralid="${referral.ID}"
                           data-violationid="${referral.ViolationId}"
                           data-taskid="${referral.TaskId}"
                           data-referralnumber="${referral.ReferralNumber || ''}"
                           data-violationcode="${referral.ViolationCode}"
                           data-totalendorsementscount="${referral.TotalEndorsementsCount || 0}"
                           data-isfinalendorsementuploaded="${referral.IsFinalEndorsementUploaded || false}">إرفاق تأشيرات النيابة</a></li>`;
            }

            actionsMenuHTML += `</ul>`;

            let displayViolationStatus = quarryViolationReferralRecords.getViolationStatus(violationStatus);

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
                        data-offendertype="${violation?.OffenderType}"
                        data-casenumber="${caseNumber}"
                        data-violationstatus="${violationStatus}"
                        data-totalendorsementscount="${referral.TotalEndorsementsCount || 0}"
                        data-isfinalendorsementuploaded="${referral.IsFinalEndorsementUploaded || false}">
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
        "#QuarryViolationReferralRecordsTable",
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
        "سجل تسجيلات إحالات المخالفات المحجرية.xlsx",
        "سجل تسجيلات إحالات المخالفات المحجرية"
    );

    if (destroyTable && $.fn.DataTable.isDataTable("#QuarryViolationReferralRecordsTable")) {
        $("#QuarryViolationReferralRecordsTable").DataTable().destroy();
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
    quarryViolationReferralRecords.dataObj.destroyTable = true;

    referralsLog.each(function (index) {
        let jQueryRecord = $(this);

        if (jQueryRecord.find(".no-data").length === 0) {
            let referralID = jQueryRecord.find(".violationCode").data("referralid");
            let referralNumber = jQueryRecord.find(".violationCode").data("referralnumber");
            let hiddenListBox = jQueryRecord.find(".controls").children(".hiddenListBox");

            // Attachments click handler
            jQueryRecord.find(".referralAttachments").find("a").off('click').on('click', function (e) {
                e.preventDefault();
                $(".overlay").addClass("active");
                quarryViolationReferralRecords.getReferralAttachmentsByReferralId(referralID, referralNumber);
            });

            // Details click handler
            jQueryRecord.find(".itemDetails").off('click').on('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                $(".overlay").addClass("active");
                quarryViolationReferralRecords.FindReferralById(referralID);
                $(".hiddenListBox").hide(300);
            });

            // Position dropdown if needed
            if (referralsLog.length > 3 && hiddenListBox.height() > 110 &&
                jQueryRecord.is(":nth-last-child(-n + 4)")) {
                hiddenListBox.addClass("toTopDDL");
            }
        }
    });

    // Attach Endorsement Action
    $(document).off('click', '.attachEndorsementAction').on('click', '.attachEndorsementAction', function (e) {
        e.preventDefault();
        e.stopPropagation();

        let referralId = $(this).data('referralid');
        let violationId = $(this).data('violationid');
        let taskId = $(this).data('taskid');
        let referralNumber = $(this).data('referralnumber');
        let violationCode = $(this).data('violationcode');
        let totalEndorsementsCount = $(this).data('totalendorsementscount');
        let isFinalEndorsementUploaded = $(this).data('isfinalendorsementuploaded');

        console.log('Attach Endorsement Action:', {
            referralId, violationId, taskId, referralNumber,
            violationCode, totalEndorsementsCount, isFinalEndorsementUploaded
        });

        // Show popup for attaching endorsements
        quarryViolationReferralRecords.attachEndorsementPopup(
            referralId,
            violationId,
            taskId,
            referralNumber,
            violationCode,
            totalEndorsementsCount,
            isFinalEndorsementUploaded
        );

        $(".hiddenListBox").hide(300);
    });

    $(document).on('click', '.controlsList a', function (e) {
        $(this).closest('.hiddenListBox').hide(300);
    });

    functions.hideTargetElement(".controls", ".hiddenListBox");
};

quarryViolationReferralRecords.attachEndorsementPopup = (
    ReferralID,
    ViolationID,
    TaskID,
    ReferralNumber,
    ViolationCode,
    TotalEndorsementsCount = 0,
    IsFinalEndorsementUploaded = false
) => {
    $(".overlay").removeClass("active");

    // Calculate next endorsement number
    let nextEndorsementNumber = TotalEndorsementsCount + 1;

    let popupHtml = `
        <div class="popupHeader">
            <div class="violationsCode"> 
                <p>إرفاق تأشيرة النيابة للإحالة رقم (${ReferralNumber}) - المخالفة (${ViolationCode})</p>
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
                                        <label for="endorsementNumber" class="customLabel">رقم التأشيرة</label>
                                        <input class="form-control customInput endorsementNumber" id="endorsementNumber" type="text" value="التأشيرة ${nextEndorsementNumber}" disabled>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="endorsementComments" class="customLabel">ملاحظات</label>
                                        <textarea class="form-control customTextArea endorsementComments" rows="3" id="endorsementComments" placeholder="أدخل الملاحظات"></textarea>
                                    </div>
                                </div>
     
                                <div class="col-12">
                                    <div class="form-group customFormGroup">
                                        <label for="endorsementAttach" class="customLabel">إرفاق مستند التأشيرة</label>
                                        <div class="fileBox" id="dropContainer">
                                            <div class="inputFileBox">
                                                <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                                <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                                <input type="file" class="customInput attachFilesInput endorsementAttach form-control" id="endorsementAttach" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx" multiple>
                                            </div>
                                        </div>
                                        <div class="dropFilesArea" id="dropFilesArea"></div>
                                    </div>
                                </div>
                                <div class="col-4">
                                    <div class="form-check customCheckBox" style="margin-top: 20px;margin-bottom: 20px;display: flex;">
                                        <input class="form-check-input" type="checkbox" id="isFinalEndorsement" 
                                            style="margin-right: 0.25rem; margin-left: 0 !important;">
                                        <label class="form-check-label" for="isFinalEndorsement" 
                                            style="margin-right: .5rem;">
                                            التأشيرة الأخيرة
                                        </label>
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
                                <div class="btnStyle confirmBtnBlue popupBtn deliverToInvestigationsBtn" id="deliverToInvestigationsBtn" style="opacity: 0.5; cursor: not-allowed;">تسليم للتحريات</div>
                                <div class="btnStyle confirmBtnBlue popupBtn attachEndorsementBtn" id="attachEndorsementBtn" style="opacity: 1;">إرفاق التأشيرة</div>
                                <div class="btnStyle cancelBtn popupBtn closeEndorsementPopup" id="closeEndorsementPopup" data-dismiss="modal" aria-label="Close">إلغاء</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

    functions.declarePopup(
        ["generalPopupStyle", "bluePopup", "editPopup"],
        popupHtml
    );

    let EndorsementCommentsInput = $("#endorsementComments").val();
    let filesExtension = [
        "gif", "svg", "jpg", "jpeg", "png",
        "doc", "docx", "pdf", "xls", "xlsx", "pptx"
    ];
    let allAttachments;
    let countOfFiles;
    let isFinalEndorsementChecked = false;
    let request = {};

    // File attachment handling
    $("#endorsementAttach").on("change", (e) => {
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

    $("#endorsementComments").on("keyup", (e) => {
        EndorsementCommentsInput = $(e.currentTarget).val().trim();
    });

    // Handle final endorsement checkbox
    $("#isFinalEndorsement").on("change", function () {
        isFinalEndorsementChecked = $(this).is(":checked");

        if (isFinalEndorsementChecked) {
            // If final endorsement is checked, dim the "إرفاق التأشيرة" button and enable "تسليم للتحريات"
            $("#attachEndorsementBtn").css({
                "opacity": "0.5",
                "cursor": "not-allowed"
            });
            $("#deliverToInvestigationsBtn").css({
                "opacity": "1",
                "cursor": "pointer"
            });
        } else {
            // If final endorsement is not checked, enable "إرفاق التأشيرة" and dim "تسليم للتحريات"
            $("#attachEndorsementBtn").css({
                "opacity": "1",
                "cursor": "pointer"
            });
            $("#deliverToInvestigationsBtn").css({
                "opacity": "0.5",
                "cursor": "not-allowed"
            });
        }
    });

    // Attach Endorsement Button Handler
    $(".attachEndorsementBtn").on("click", (e) => {
        if (!isFinalEndorsementChecked) {
            if (allAttachments != null && allAttachments.length > 0) {
                request = {
                    Request: {
                        Title: "تم إرفاق تأشيرة النيابة",
                        Status: "قيد انتظار تأشيرات النيابة",
                        Comments: EndorsementCommentsInput,
                        ViolationId: ViolationID,
                        TaskId: TaskID,
                        ID: ReferralID,
                        TotalEndorsementsCount: nextEndorsementNumber,
                        IsNewEndorsementUpload: true
                    }
                };

                $(".overlay").addClass("active");
                quarryViolationReferralRecords.saveEndorsementAPI(
                    request,
                    ReferralID,
                    "إرفاق تأشيرة النيابة",
                    "#endorsementAttach",
                    "تم إرفاق تأشيرة النيابة بنجاح"
                );
            } else {
                functions.warningAlert("من فضلك قم بإرفاق مستند التأشيرة");
            }
        } else {
            functions.warningAlert("لا يمكن إرفاق تأشيرة عند اختيار التأشيرة الأخيرة. استخدم زر 'تسليم للتحريات' بدلاً من ذلك.");
        }
    });

    // Deliver to Investigations Button Handler
    $(".deliverToInvestigationsBtn").on("click", (e) => {
        if (isFinalEndorsementChecked) {
            if (allAttachments != null && allAttachments.length > 0) {
                request = {
                    Request: {
                        ID: ReferralID,
                        Title: "تم تسليم الإحالة للتحريات",
                        Status: "تم التسليم للتحريات",
                        Comments: EndorsementCommentsInput,
                        ViolationId: ViolationID,
                        TaskId: TaskID,
                        IsFinalEndorsementUploaded: true,
                        TotalEndorsementsCount: nextEndorsementNumber
                    }
                };

                $(".overlay").addClass("active");
                quarryViolationReferralRecords.saveEndorsementAPI(
                    request,
                    ReferralID,
                    "التسليم للتحريات",
                    "#endorsementAttach",
                    "تم تسليم الإحالة للتحريات بنجاح"
                );
            } else {
                functions.warningAlert("من فضلك قم بإرفاق مستند التأشيرة الأخيرة");
            }
        } else {
            functions.warningAlert("يجب تحديد 'التأشيرة الأخيرة' أولاً لتتمكن من التسليم للتحريات");
        }
    });
};

quarryViolationReferralRecords.saveEndorsementAPI = (
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
                quarryViolationReferralRecords.addNewReferralAttachmentRecord(
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

quarryViolationReferralRecords.addNewReferralAttachmentRecord = (
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
                quarryViolationReferralRecords.uploadReferralAttachments(
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

quarryViolationReferralRecords.uploadReferralAttachments = (
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
            quarryViolationReferralRecords.getQuarryViolationReferralsRecords(
                quarryViolationReferralRecords.pageIndex,
                true
            );
        },
        error: (err) => {
            functions.warningAlert("خطأ في إرسال البيانات لقاعدة البيانات");
            $(".overlay").removeClass("active");
        },
    });
};

quarryViolationReferralRecords.getReferralAttachmentsByReferralId = (ReferralId, referralNumber) => {
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
                quarryViolationReferralRecords.referralAttachmentsDetailsPopup(
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

quarryViolationReferralRecords.referralAttachmentsDetailsPopup = (
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
        ["generalPopupStyle", "bluePopup", "editPopup", "attachPopup"],
        popupHtml
    );

    quarryViolationReferralRecords.drawReferralAttachmentsPopupTable(
        "#referralAttachmentsTable",
        ReferralAttachmentsRecords
    );

    // Add close button handler
    $("#closeReferralAttachPopup").on("click", function () {
        functions.closePopup();
    });
};

quarryViolationReferralRecords.drawReferralAttachmentsPopupTable = (
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
                    ${quarryViolationReferralRecords.drawAttachmentsInTable(attachedFilesData)}
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

quarryViolationReferralRecords.drawAttachmentsInTable = (Attachments) => {
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

quarryViolationReferralRecords.FindReferralById = (ReferralID, popupType = "") => {
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
                // Fix: Ensure Equipments exists
                if (referralData.Violation && !referralData.Violation.Equipments) {
                    referralData.Violation.Equipments = [];
                }

                // Create a popup with both violation details and referral/case details
                $(".overlay").removeClass("active");

                // Build the popup HTML similar to quarryViolationReferral.getReferralDetails
                Content = quarryViolationReferralRecords.getReferralDetails(referralData);

                functions.declarePopup(
                    ["generalPopupStyle", "bluePopup", "caseDetailsPopup"],
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

quarryViolationReferralRecords.filterQuarryViolationReferralsRecords = (e) => {
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
    quarryViolationReferralRecords.getQuarryViolationReferralsRecords(
        1,
        true,
        ReferralNumber,
        CaseStatus,
        OffenderType,
        RefferedDateFrom,
        RefferedDateTo
    );
};

quarryViolationReferralRecords.getViolationStatus = (ViolationStatus) => {
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

quarryViolationReferralRecords.getReferralDetails = (referralData) => {
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
    <div class="popupBody" style="overflow-y: auto; max-height: 80vh;">
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
                                        <input class="form-control customInput violationStatus" id="violationStatus" type="text" value="${quarryViolationReferralRecords.getViolationStatusText(referralData.ViolationStatus)}" disabled>
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
            ? quarryViolationReferralRecords.referralQuarryDetails(violation)
            : violationOffenderType == "Vehicle"
                ? quarryViolationReferralRecords.referralVehicleDetails(violation)
                : quarryViolationReferralRecords.referralEquipmentDetails(violation)
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

quarryViolationReferralRecords.getViolationStatusText = (status) => {
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

quarryViolationReferralRecords.referralQuarryDetails = (violationData) => {
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

quarryViolationReferralRecords.referralVehicleDetails = (violationData) => {
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

quarryViolationReferralRecords.referralEquipmentDetails = (violationData) => {
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

// Initialization
quarryViolationReferralRecords.init = () => {
    quarryViolationReferralRecords.pageIndex = 1;
    quarryViolationReferralRecords.dataObj.destroyTable = false;

    // Setup event listeners
    $(".searchBtn").off("click").on("click", quarryViolationReferralRecords.filterQuarryViolationReferralsRecords);

    $(".filterBox input").off("keypress").on("keypress", function (e) {
        if (e.which === 13) {
            quarryViolationReferralRecords.filterQuarryViolationReferralsRecords(e);
        }
    });

    // Load initial data
    $(".PreLoader").addClass("active");
    quarryViolationReferralRecords.getQuarryViolationReferralsRecords();
};

$(document).ready(function () {
    if (functions.getPageName() === "QuarryViolationReferralRecords") {
        quarryViolationReferralRecords.init();
    }
});

export default quarryViolationReferralRecords;
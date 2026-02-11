import functions from "./functions";

let DetailsPopup = {};

DetailsPopup.quarryDetailsPopupContent = (violationData, LogName = "") => {
    let violationPriceType =
        violationData.ViolationTypes != null
            ? violationData.ViolationTypes.PriceType
            : "";
    let violationDate = functions.getFormatedDate(
        violationData?.ViolationDate,
        "DD-MM-YYYY",
    );
    let violationTime = functions.getFormatedDate(
        violationData?.ViolationTime,
        "hh:mm A",
    );
    let ViolationCode =
        violationData.ViolationCode != "" ? violationData.ViolationCode : "-----";
    // Fix: Check if Equipments exists before using it
    let Equipments = violationData.Equipments ?
        DetailsPopup.getViolationEquipments(
            violationData.Equipments,
            violationData.Equipments_Count
        ) :
        '<div class="noEquipments">لم يتم إضافة معدات مضبوطة</div>';
    let Coordinates = DetailsPopup.getViolationCoords(
        violationData.CoordinatesDegrees,
    );
    // let Coordinates = DetailsPopup.getViolationCoords(violationData.Coordinates)
    DetailsPopup.getViolationAttachmentsById(violationData.ID);

    ///////////////////////////////////////////////////////
    DetailsPopup.getCommitteeRecorder(violationData.SectorConfigId);

    if (violationData?.CommiteeMember?.length > 0) {
        // DetailsPopup.getCommitteeMember(violationData.CommiteeMember)
    }
    // DetailsPopup.getCommitteeManager(violationData.Sector)
    ///////////////////////////////////////////////////////

    let popupHtml = `
        <div class="popupHeader">
            <div class="violationsCode"> 
                <p>مخالفة المحجر رقم ${ViolationCode}</p>
                <div class="printBtn"><img src="${functions.getSiteName() == "ViolationsRecorder"
            ? "/Style Library/MiningViolations/images/BluePrintBtn.png"
            : "/Style Library/MiningViolations/images/GreenPrintBtn.png"
        }" alt="Print Button"></div>
            </div>
            <div class="backBtn">
                <div class="bootpopup-button close" data-dismiss="modal" aria-label="Close">
                   <a href="#!"> العودة إلى سجل المخالفات ${LogName} <i class="fa-solid fa-angle-left"></i></a>
                </div>
            </div>
        </div>
        <div class="popupFormBoxHeader">
            <p class="formBoxTitle"><span class="formNumber">1</span> تفاصيل المخالفة</p>
        </div>
        <div class="popupBody">
            <div class="popupForm detailsPopupForm" id="detailsPopupForm">
                <div class="formContent">
  
                    <div class="formBox">
                        <div class="formElements">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="violatorName" class="customLabel">اسم المخالف</label>
                                        <input class="form-control customInput violatorName" id="violatorName" type="text" value="${violationData.ViolatorName
        }" disabled>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-group customFormGroup">
                                        <label for="violatorNationalId" class="customLabel">الرقم القومي للمخالف</label>
                                        <input class="form-control customInput violatorNationalId" id="violatorNationalId" type="text" value="${violationData.NationalID != ""
            ? violationData.NationalID
            : "-"
        }" disabled>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-group customFormGroup">
                                        <label for="prevViolationsCount" class="customLabel">عدد المخالفات السابقة</label>
                                        <input class="form-control customInput prevViolationsCount" id="prevViolationsCount" type="text" value="${violationData.NumOfPreviousViolations
        }" disabled>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="companyName" class="customLabel">الشركة المخالفة التابع لها</label>
                                        <input class="form-control customInput companyName" id="companyName" type="text" value="${violationData.ViolatorCompany != ""
            ? violationData.ViolatorCompany
            : "-"
        }" disabled>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="commercialRegister" class="customLabel">السجل التجاري للشركة</label>
                                        <input class="form-control customInput commercialRegister" id="commercialRegister" type="text" value="${violationData.CommercialRegister != ""
            ? violationData.CommercialRegister
            : "-"
        }" disabled>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="violationGov" class="customLabel">المحافظة</label>
                                        <input class="form-control customInput violationGov" id="violationGov" type="text" value="${violationData.Governrates != null
            ? violationData.Governrates.Title
            : "-"
        }" disabled>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="violationArea" class="customLabel">منطقة الضبط</label>
                                        <input class="form-control customInput violationArea" id="violationArea" type="text" value="${violationData.ViolationsZone
        }" disabled>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="hiddenDetailsBox">
                        <div class="formBox">
                            <div class="formElements">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="form-group customFormGroup">
                                            <label for="violationType" class="customLabel">نوع المخالفة</label>
                                            <input class="form-control customInput violationType" id="violationType" type="text" value="${violationData.ViolationTypes !=
            null
            ? violationData.ViolationTypes
                .Title
            : "-"
        }" disabled>
                                        </div>
                                    </div>
                                    <div class="col-md-6 BonesBox" style="display:${violationData.ViolationTypes.Title ==
            "اصدار بونات فارغة" ||
            violationData.ViolationTypes.Title ==
            "بيع بونات" ||
            violationData.ViolationTypes.Title ==
            "استخدام بونات الغير" ||
            violationData.ViolationTypes.Title ==
            "تلاعب ببيانات البونات"
            ? "block !important"
            : "none !important"
        }">
                                        <div class="form-group customFormGroup">
                                            <label for="bonesCount" class="customLabel">عدد البونات</label>
                                            <input class="form-control customInput bonesCount" id="bonesCount" type="text" value="${violationData.BonsNumber
        }" disabled>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-group customFormGroup">
                                            <label for="violationRawType" class="customLabel">نوع الخام</label>
                                            <input class="form-control customInput violationRawType" id="violationRawType" type="text" value="${violationData.Material != null
            ? violationData.Material.Title
            : "-"
        }" disabled>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-group customFormGroup">
                                            <label for="violationDate" class="customLabel">تاريخ الضبط</label>
                                            <div class="inputIconBox">
                                                <input class="form-control customInput inputDate violationDate"
                                                    id="violationDate" type="text" value="${violationDate}" disabled>
                                                <i class="fa-solid fa-calendar-days"></i>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-group customFormGroup">
                                            <label for="violationTime" class="customLabel">وقت الضبط</label>
                                            <div class="inputIconBox">
                                                <input class="form-control customInput timeInput violationTime" id="violationTime" type="text" value="${violationTime}" disabled>
                                                <i class="fa-solid fa-clock"></i>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-group customFormGroup">
                                            <label for="quarryType" class="customLabel">نوع المحجر</label>
                                            <input class="form-control customInput quarryType" id="quarryType" type="text" value="${violationData.QuarryType
        }" disabled>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-group customFormGroup">
                                            <label for="quarryCode" class="customLabel">رقم المحجر</label>
                                            <input class="form-control customInput quarryCode" id="quarryCode" type="text" value="${violationData.QuarryCode != ""
            ? violationData.QuarryCode
            : "-"
        }" disabled>
                                        </div>
                                    </div>
                                    
                                    <div class="col-12" style="display:${(violationPriceType == "fixed" ||
            violationPriceType == "store") &&
            !Equipments
            ? "none"
            : "block"
        }" >
                                        <div class="form-group customFormGroup">
                                            <label class="customLabel">ضبط معدات</label>
                                            ${Equipments}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
    
                        <div class="formBox">
                            <div class="formElements">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="form-group customFormGroup">
                                            <div class="feildInfoBox">
                                                <label for="violationDepth" class="customLabel">العمق/الإرتفاع</label>
                                                <span class="metaDataSpan">بالمتر</span>
                                            </div>
                                            <input class="form-control customInput violationDepth" id="violationDepth" type="text" value="${violationData.Depth
        }" disabled>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-group customFormGroup">
                                            <div class="feildInfoBox">
                                                <label for="AreaSpace" class="customLabel">مساحة منطقة المخالفة</label>
                                                <span class="metaDataSpan">بالمتر المربع</span>
                                            </div>
                                            <input class="form-control customInput AreaSpace" id="AreaSpace" type="text" value="${violationData.Area
        }" disabled>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-group customFormGroup">
                                            <div class="feildInfoBox">
                                                <label for="totalAreaSpace" class="customLabel">الكمية</label>
                                                <span class="metaDataSpan">بالمتر المكعب</span>
                                            </div>
                                            <input class="form-control customInput totalAreaSpace" id="totalAreaSpace" type="text" value="${violationData.TotalQuantity
        }" disabled>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-group customFormGroup">
                                            <div class="feildInfoBox">
                                                <label for="distanceToNearQuarry" class="customLabel">المسافة لأقرب محجر</label>
                                                <span class="metaDataSpan">متر</span>
                                            </div>
                                            <input class="form-control customInput distanceToNearQuarry"
                                                id="distanceToNearQuarry" type="text" value="${violationData.DistanceToNearestQuarry
        }" disabled>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-group customFormGroup">
                                            <label for="NearestQuarryNumber" class="customLabel">رقم أقرب محجر</label>
                                            <input class="form-control customInput NearestQuarryNumber" id="NearestQuarryNumber" type="text" value="${violationData.NearestQuarryCode
        }" disabled>
                                        </div>
                                    </div>
                                    <div class="col-12">
                                        <div class="form-group customFormGroup">
                                            <div class="feildInfoBox">
                                                <label class="customLabel">الإحداثيات</label>
                                                <!--<a href="#!" class="titleLink showOnMapBtn"><i class="fa-solid fa-map-pin"></i> عرض على الخريطة</a>-->
                                            </div>
                                            <div class="coordinatesTable" id="coordinatesTable">
                                                ${Coordinates}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
    
                        <div class="formBox">
                            <div class="formElements">
                                <div class="row">
                                    <div class="col-md-8 violationsAttachmentsBox">
                                        <div class="feildInfoBox">
                                            <label class="customLabel">المرفقات</label>
                                            <a href="#!" class="titleLink downloadAllFiles">
                                            <i class="fa-solid fa-download"></i> تنزيل الكل</a>
                                        </div>
                                        <div class="attachBox"></div>
                                    </div>
                                    <div class="col-md-4 violationDescriptionBox">  
                                        <div class="form-group customFormGroup">
                                            <label for="violationDescription" class="customLabel">وصف المخالفة</label>
                                            <textarea class="form-control violationDescription customTextArea" id="violationDescription" value="${violationData.Description
        }" disabled>${violationData.Description
        }</textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
    
                        <div class="formBox">
                            <div class="formElements">
                                <div class="row">
                                    <div class="col-12">
                                        <div class="form-group customFormGroup">
                                            <label for="sectorManegrOpinion" class="customLabel">رأي قائد القطاع</label>
                                            <textarea class="form-control sectorManegrOpinion customTextArea" id="sectorManegrOpinion" value="${violationData.LeaderOpinion
        }" disabled>${violationData.LeaderOpinion
        }</textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="formBox CommiteeMembersBox">
                            <div class="formElements">
                                <div class="row">
                                    <div class="col-md-4 recorderBox committeeMembersDataBox">
                                        <div class="form-group customFormGroup">
                                            <label for="recorderNameText" class="customLabel"> عضو لجنة </label>
                                            <textarea class="form-control recorderNameText customTextArea" rows="4" id="recorderNameText" value="${violationData.SectorMembers
        }" disabled>${violationData.SectorMembers
        }</textarea>
                                        </div>
                                    </div>
                                    <div class="col-md-6 memberBox committeeMembersDataBox" style="display:${violationData.CommiteeMember == ""
            ? "none"
            : "block"
        }">
                                        <div class="form-group customFormGroup">
                                            <label for="memberName" class="customLabel">القائمون بالضبط</label>                                            
                                            <textarea class="form-control memberName customTextArea" rows="4" id="memberName" value="${violationData.CommiteeMember
        }" disabled>${violationData.CommiteeMember
        }</textarea>
                                        </div>
                                    </div>
                                    <div class="col-md-4 leaderBox committeeMembersDataBox" style="display:none">
                                        <div class="form-group customFormGroup">
                                            <label for="leaderName" class="customLabel">قائد القطاع</label>
                                            <input class="form-control customInput leaderName" id="leaderName" type="text" disabled>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="formBox rejectReasonBox">
                            <div class="formElements">
                                <div class="row">
                                    <div class="col-12">
                                        <div class="form-group customFormGroup">
                                            <label for="rejectReason" class="customLabel">سبب الرفض</label>
                                            <textarea class="form-control rejectReason customTextArea" id="rejectReason" disabled></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="formBox addConfirmationAttchBox">
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

                        <div class="formBox totalPriceBox">
                            <div class="formElements">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="form-group customFormGroup">
                                            <div class="feildInfoBox">
                                                <label class="customLabel" for="totalPrice">إجمالي المبلغ المستحق</label>
                                                <a href="#!" class="titleLink showFormula"> تفاصيل حساب المبلغ المستحق</a>
                                            </div>
                                            <div class="inputIconBox">
                                                <input class="form-control customInput ${functions.getSiteName() ==
            "ViolationsRecorder"
            ? "blueInput"
            : "greenInput"
        } totalPrice" id="totalPrice" type="text" value="${functions.splitBigNumbersByComma(
            violationData?.TotalPriceDue,
        )}" disabled>
                                                <span>جنيها</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6 dateLimitBox">
                                        <div class="form-group customFormGroup">
                                            <label class="customLabel">تاريخ مدة نهاية التصالح</label>
                                            <input class="form-control customInput ${functions.getSiteName() ==
            "ViolationsRecorder"
            ? "blueInput"
            : "greenInput"
        } violationEndTime" id="violationEndTime" type="text" disabled>
                                        </div>
                                    </div>
                                    <div class="col-md-6 bankAccountBox">
                                        <div class="form-group customFormGroup">
                                            <label class="customLabel">رقم الحساب البنكي</label>
                                            <input class="form-control customInput ${functions.getSiteName() ==
            "ViolationsRecorder"
            ? "blueInput"
            : "greenInput"
        } bankAccountNumber" id="bankAccountNumber" type="text" value="0074-20316180906-45" disabled>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="formBox confirmationAttachBox">
                            <div class="formElements">
                                <div class="row">
                                    <div class="col-12">
                                        <label class="customLabel">المرفقات / مستندات التصديق</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="showMoreDetails">
                        <div class="moreDetailsInnerBox">
                            <img src="/Style Library/MiningViolations/images/arrowDown.png" alt="Arrow Down">
                            <p>إظهار المزيد من التفاصيل</p>
                        </div>
                    </div>
                </div>              
  
                <div class="formButtonsBox">
                    <div class="row">
                        <div class="col-12">
                            <div class="buttonsBox centerButtonsBox ">
                                <div class="btnStyle confirmBtnGreen popupBtn approveViolation" id="approveViolation">موافقة على المخالفة</div>
                                <div class="btnStyle confirmBtnGreen popupBtn editMaterialMinPrice" id="editMaterialMinPrice">تعديل الحد الأدنى</div>
                                <div class="btnStyle cancelBtn popupBtn rejectViolation" id="rejectViolation">رفض المخالفة</div>
                                <div class="btnStyle cancelBtn popupBtn payPartPrice" id="payPartPrice">تسديد المخالفة</div>
                                <div class="btnStyle confirmBtnGreen popupBtn payAllPrice" id="payAllPrice">تسديد وإنهاء المخالفة </div>
                                <div class="btnStyle confirmBtnGreen popupBtn confirmViolation" id="confirmViolation">التصديق على المخالفة </div>
                                <div class="btnStyle cancelBtn popupBtn closeDetailsPopup" id="closeDetailsPopup" data-dismiss="modal" aria-label="Close">إغلاق</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="popupFormBoxHeader">
            <p class="formBoxTitle"><span class="formNumber">2</span> تسديد المخالفة</p>
        </div>
    `;
    $(".overlay").removeClass("active");
    return popupHtml;
};
DetailsPopup.equipmentDetailsPopupContent = (violationData, LogName = "") => {
    let violationPriceType =
        violationData.ViolationTypes != null
            ? violationData.ViolationTypes.PriceType
            : "";
    let violationDate = functions.getFormatedDate(
        violationData?.ViolationDate,
        "DD-MM-YYYY",
    );
    let violationTime = functions.getFormatedDate(
        violationData?.ViolationTime,
        "hh:mm A",
    );
    let ViolationCode =
        violationData.ViolationCode != "" ? violationData.ViolationCode : "-----";
    let Equipments = DetailsPopup.getViolationEquipments(
        violationData.Equipments,
        violationData.Equipments_Count,
    );
    let Coordinates = DetailsPopup.getViolationCoords(
        violationData.CoordinatesDegrees,
    );
    // let Coordinates = DetailsPopup.getViolationCoords(violationData.Coordinates)
    DetailsPopup.getViolationAttachmentsById(violationData.ID);

    ///////////////////////////////////////////////////////
    DetailsPopup.getCommitteeRecorder(violationData.SectorConfigId);

    if (violationData?.CommiteeMember?.length > 0) {
        // DetailsPopup.getCommitteeMember(violationData.CommiteeMember)
    }
    // DetailsPopup.getCommitteeManager(violationData.Sector)
    ///////////////////////////////////////////////////////

    let popupHtml = `
        <div class="popupHeader">
            <div class="violationsCode"> 
                <p>مخالفة المعدة رقم ${ViolationCode}</p>
                <div class="printBtn"><img src="${functions.getSiteName() == "ViolationsRecorder"
            ? "/Style Library/MiningViolations/images/BluePrintBtn.png"
            : "/Style Library/MiningViolations/images/GreenPrintBtn.png"
        }" alt="Print Button"></div>
            </div>
            <div class="backBtn">
                <div class="bootpopup-button close" data-dismiss="modal" aria-label="Close">
                   <a href="#!"> العودة إلى سجل المخالفات ${LogName} <i class="fa-solid fa-angle-left"></i></a>
                </div>
            </div>
        </div>
        <div class="popupFormBoxHeader">
            <p class="formBoxTitle"><span class="formNumber">1</span> تفاصيل المخالفة</p>
        </div>
        <div class="popupBody">
            <div class="popupForm detailsPopupForm" id="detailsPopupForm">
                <div class="formContent">
  
                    <div class="formBox">
                        <div class="formElements">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="violatorName" class="customLabel">اسم المخالف</label>
                                        <input class="form-control customInput violatorName" id="violatorName" type="text" value="${violationData.ViolatorName
        }" disabled>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-group customFormGroup">
                                        <label for="violatorNationalId" class="customLabel">الرقم القومي للمخالف</label>
                                        <input class="form-control customInput violatorNationalId" id="violatorNationalId" type="text" value="${violationData.NationalID != ""
            ? violationData.NationalID
            : "-"
        }" disabled>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-group customFormGroup">
                                        <label for="prevViolationsCount" class="customLabel">عدد المخالفات السابقة</label>
                                        <input class="form-control customInput prevViolationsCount" id="prevViolationsCount" type="text" value="${violationData.NumOfPreviousViolations
        }" disabled>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="companyName" class="customLabel">الشركة المخالفة التابع لها</label>
                                        <input class="form-control customInput companyName" id="companyName" type="text" value="${violationData.ViolatorCompany != ""
            ? violationData.ViolatorCompany
            : "-"
        }" disabled>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="commercialRegister" class="customLabel">السجل التجاري للشركة</label>
                                        <input class="form-control customInput commercialRegister" id="commercialRegister" type="text" value="${violationData.CommercialRegister != ""
            ? violationData.CommercialRegister
            : "-"
        }" disabled>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="violationGov" class="customLabel">المحافظة</label>
                                        <input class="form-control customInput violationGov" id="violationGov" type="text" value="${violationData.Governrates != null
            ? violationData.Governrates.Title
            : "-"
        }" disabled>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="violationArea" class="customLabel">منطقة الضبط</label>
                                        <input class="form-control customInput violationArea" id="violationArea" type="text" value="${violationData.ViolationsZone
        }" disabled>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="hiddenDetailsBox">
                        <div class="formBox">
                            <div class="formElements">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="form-group customFormGroup">
                                            <label for="violationType" class="customLabel">نوع المخالفة</label>
                                            <input class="form-control customInput violationType" id="violationType" type="text" value="${violationData.ViolationTypes !=
            null
            ? violationData?.ViolationTypes
                ?.Title
            : "-"
        }" disabled>
                                        </div>
                                    </div>
                                    <div class="col-md-6 BonesBox" style="display:${violationData?.ViolationTypes?.Title ==
            "اصدار بونات فارغة" ||
            violationData?.ViolationTypes?.Title ==
            "بيع بونات" ||
            violationData?.ViolationTypes?.Title ==
            "استخدام بونات الغير" ||
            violationData?.ViolationTypes?.Title ==
            "تلاعب ببيانات البونات"
            ? "block !important"
            : "none !important"
        }">
                                        <div class="form-group customFormGroup">
                                            <label for="bonesCount" class="customLabel">عدد البونات</label>
                                            <input class="form-control customInput bonesCount" id="bonesCount" type="text" value="${violationData.BonsNumber
        }" disabled>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-group customFormGroup">
                                            <label for="violationRawType" class="customLabel">نوع الخام</label>
                                            <input class="form-control customInput violationRawType" id="violationRawType" type="text" value="${violationData.Material != null
            ? violationData.Material.Title
            : "-"
        }" disabled>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-group customFormGroup">
                                            <label for="violationDate" class="customLabel">تاريخ الضبط</label>
                                            <div class="inputIconBox">
                                                <input class="form-control customInput inputDate violationDate"
                                                    id="violationDate" type="text" value="${violationDate}" disabled>
                                                <i class="fa-solid fa-calendar-days"></i>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-group customFormGroup">
                                            <label for="violationTime" class="customLabel">وقت الضبط</label>
                                            <div class="inputIconBox">
                                                <input class="form-control customInput timeInput violationTime" id="violationTime" type="text" value="${violationTime}" disabled>
                                                <i class="fa-solid fa-clock"></i>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-group customFormGroup">
                                            <label for="quarryType" class="customLabel">نوع المحجر</label>
                                            <input class="form-control customInput quarryType" id="quarryType" type="text" value="${violationData.QuarryType
        }" disabled>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-group customFormGroup">
                                            <label for="quarryCode" class="customLabel">رقم المحجر</label>
                                            <input class="form-control customInput quarryCode" id="quarryCode" type="text" value="${violationData.QuarryCode != ""
            ? violationData.QuarryCode
            : "-"
        }" disabled>
                                        </div>
                                    </div>
                                    
                                    <div class="col-12" style="display:${(violationPriceType == "fixed" ||
            violationPriceType == "store") &&
            !Equipments
            ? "none"
            : "block"
        }" >
                                        <div class="form-group customFormGroup">
                                            <label class="customLabel">ضبط معدات</label>
                                            ${Equipments}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
    
                        <div class="formBox">
                            <div class="formElements">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="form-group customFormGroup">
                                            <div class="feildInfoBox">
                                                <label for="violationDepth" class="customLabel">العمق/الإرتفاع</label>
                                                <span class="metaDataSpan">بالمتر</span>
                                            </div>
                                            <input class="form-control customInput violationDepth" id="violationDepth" type="text" value="${violationData.Depth
        }" disabled>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-group customFormGroup">
                                            <div class="feildInfoBox">
                                                <label for="AreaSpace" class="customLabel">مساحة منطقة المخالفة</label>
                                                <span class="metaDataSpan">بالمتر المربع</span>
                                            </div>
                                            <input class="form-control customInput AreaSpace" id="AreaSpace" type="text" value="${violationData.Area
        }" disabled>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-group customFormGroup">
                                            <div class="feildInfoBox">
                                                <label for="totalAreaSpace" class="customLabel">الكمية</label>
                                                <span class="metaDataSpan">بالمتر المكعب</span>
                                            </div>
                                            <input class="form-control customInput totalAreaSpace" id="totalAreaSpace" type="text" value="${violationData.TotalQuantity
        }" disabled>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-group customFormGroup">
                                            <div class="feildInfoBox">
                                                <label for="distanceToNearQuarry" class="customLabel">المسافة لأقرب محجر</label>
                                                <span class="metaDataSpan">متر</span>
                                            </div>
                                            <input class="form-control customInput distanceToNearQuarry"
                                                id="distanceToNearQuarry" type="text" value="${violationData.DistanceToNearestQuarry
        }" disabled>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-group customFormGroup">
                                            <label for="NearestQuarryNumber" class="customLabel">رقم أقرب محجر</label>
                                            <input class="form-control customInput NearestQuarryNumber" id="NearestQuarryNumber" type="text" value="${violationData.NearestQuarryCode
        }" disabled>
                                        </div>
                                    </div>
                                    <div class="col-12">
                                        <div class="form-group customFormGroup">
                                            <div class="feildInfoBox">
                                                <label class="customLabel">الإحداثيات</label>
                                                <!--<a href="#!" class="titleLink showOnMapBtn"><i class="fa-solid fa-map-pin"></i> عرض على الخريطة</a>-->
                                            </div>
                                            <div class="coordinatesTable" id="coordinatesTable">
                                                ${Coordinates}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
    
                        <div class="formBox">
                            <div class="formElements">
                                <div class="row">
                                    <div class="col-md-8 violationsAttachmentsBox">
                                        <div class="feildInfoBox">
                                            <label class="customLabel">المرفقات</label>
                                            <a href="#!" class="titleLink downloadAllFiles">
                                            <i class="fa-solid fa-download"></i> تنزيل الكل</a>
                                        </div>
                                        <div class="attachBox"></div>
                                    </div>
                                    <div class="col-md-4 violationDescriptionBox">  
                                        <div class="form-group customFormGroup">
                                            <label for="violationDescription" class="customLabel">وصف المخالفة</label>
                                            <textarea class="form-control violationDescription customTextArea" id="violationDescription" value="${violationData.Description
        }" disabled>${violationData.Description
        }</textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
    
                        <div class="formBox">
                            <div class="formElements">
                                <div class="row">
                                    <div class="col-12">
                                        <div class="form-group customFormGroup">
                                            <label for="sectorManegrOpinion" class="customLabel">رأي قائد القطاع</label>
                                            <textarea class="form-control sectorManegrOpinion customTextArea" id="sectorManegrOpinion" value="${violationData.LeaderOpinion
        }" disabled>${violationData.LeaderOpinion
        }</textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="formBox CommiteeMembersBox">
                            <div class="formElements">
                                <div class="row">
                                    <div class="col-md-4 recorderBox committeeMembersDataBox">
                                        <div class="form-group customFormGroup">
                                            <label for="recorderNameText" class="customLabel"> عضو لجنة </label>
                                            <textarea class="form-control recorderNameText customTextArea" rows="4" id="recorderNameText" value="${violationData.SectorMembers
        }" disabled>${violationData.SectorMembers
        }</textarea>
                                        </div>
                                    </div>
                                    <div class="col-md-6 memberBox committeeMembersDataBox" style="display:${violationData.CommiteeMember == ""
            ? "none"
            : "block"
        }">
                                        <div class="form-group customFormGroup">
                                            <label for="memberName" class="customLabel">القائمون بالضبط</label>                                            
                                            <textarea class="form-control memberName customTextArea" rows="4" id="memberName" value="${violationData.CommiteeMember
        }" disabled>${violationData.CommiteeMember
        }</textarea>
                                        </div>
                                    </div>
                                    <div class="col-md-4 leaderBox committeeMembersDataBox" style="display:none">
                                        <div class="form-group customFormGroup">
                                            <label for="leaderName" class="customLabel">قائد القطاع</label>
                                            <input class="form-control customInput leaderName" id="leaderName" type="text" disabled>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="formBox rejectReasonBox">
                            <div class="formElements">
                                <div class="row">
                                    <div class="col-12">
                                        <div class="form-group customFormGroup">
                                            <label for="rejectReason" class="customLabel">سبب الرفض</label>
                                            <textarea class="form-control rejectReason customTextArea" id="rejectReason" disabled></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="formBox addConfirmationAttchBox">
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

                        <div class="formBox totalPriceBox">
                            <div class="formElements">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="form-group customFormGroup">
                                            <div class="feildInfoBox">
                                                <label class="customLabel" for="totalPrice">إجمالي المبلغ المستحق</label>
                                                <a href="#!" class="titleLink showFormula"> تفاصيل حساب المبلغ المستحق</a>
                                            </div>
                                            <div class="inputIconBox">
                                                <input class="form-control customInput ${functions.getSiteName() ==
            "ViolationsRecorder"
            ? "blueInput"
            : "greenInput"
        } totalPrice" id="totalPrice" type="text" value="${functions.splitBigNumbersByComma(
            violationData?.TotalPriceDue,
        )}" disabled>
                                                <span>جنيها</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6 dateLimitBox">
                                        <div class="form-group customFormGroup">
                                            <label class="customLabel">تاريخ مدة نهاية التصالح</label>
                                            <input class="form-control customInput ${functions.getSiteName() ==
            "ViolationsRecorder"
            ? "blueInput"
            : "greenInput"
        } violationEndTime" id="violationEndTime" type="text" disabled>
                                        </div>
                                    </div>
                                    <div class="col-md-6 bankAccountBox">
                                        <div class="form-group customFormGroup">
                                            <label class="customLabel">رقم الحساب البنكي</label>
                                            <input class="form-control customInput ${functions.getSiteName() ==
            "ViolationsRecorder"
            ? "blueInput"
            : "greenInput"
        } bankAccountNumber" id="bankAccountNumber" type="text" value="0074-20316180906-45" disabled>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="formBox confirmationAttachBox">
                            <div class="formElements">
                                <div class="row">
                                    <div class="col-12">
                                        <label class="customLabel">المرفقات / مستندات التصديق</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="showMoreDetails">
                        <div class="moreDetailsInnerBox">
                            <img src="/Style Library/MiningViolations/images/arrowDown.png" alt="Arrow Down">
                            <p>إظهار المزيد من التفاصيل</p>
                        </div>
                    </div>
                </div>              
  
                <div class="formButtonsBox">
                    <div class="row">
                        <div class="col-12">
                            <div class="buttonsBox centerButtonsBox ">
                                <div class="btnStyle confirmBtnGreen popupBtn approveViolation" id="approveViolation">موافقة على المخالفة</div>
                                <div class="btnStyle cancelBtn popupBtn rejectViolation" id="rejectViolation">رفض المخالفة</div>
                                <div class="btnStyle cancelBtn popupBtn payPartPrice" id="payPartPrice">تسديد المخالفة</div>
                                <div class="btnStyle confirmBtnGreen popupBtn payAllPrice" id="payAllPrice">تسديد وإنهاء المخالفة </div>
                                <div class="btnStyle confirmBtnGreen popupBtn confirmViolation" id="confirmViolation">التصديق على المخالفة </div>
                                <div class="btnStyle cancelBtn popupBtn closeDetailsPopup" id="closeDetailsPopup" data-dismiss="modal" aria-label="Close">إغلاق</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="popupFormBoxHeader">
            <p class="formBoxTitle"><span class="formNumber">2</span> تسديد المخالفة</p>
        </div>
    `;
    $(".overlay").removeClass("active");
    return popupHtml;
};
DetailsPopup.vehicleDetailsPopupContent = (violationData, LogName = "") => {
    let violationDate = functions.getFormatedDate(
        violationData?.ViolationDate,
        "DD-MM-YYYY",
    );
    let violationTime = functions.getFormatedDate(
        violationData?.ViolationTime,
        "hh:mm A",
    );
    let ViolationCode =
        violationData.ViolationCode != "" ? violationData.ViolationCode : "-----";
    let Coordinates = DetailsPopup.getViolationCoords(
        violationData.CoordinatesDegrees,
    );
    // let Coordinates = DetailsPopup.getViolationCoords(violationData.Coordinates)

    DetailsPopup.getViolationAttachmentsById(violationData.ID);
    DetailsPopup.getCommitteeRecorder(violationData.SectorConfigId);

    if (violationData?.CommiteeMember?.length > 0) {
        // violationData.CommiteeMember.forEach(memberId=>{
        //     $(".CommiteeMembersBox").find(".memberBox").append(`<div class="member">This is Member</div>`)
        // })
        // DetailsPopup.getCommitteeMember(violationData.CommiteeMember)
    }
    // DetailsPopup.getCommitteeManager(violationData.Sector)
    // <!--<label for="recorderNameText" class="customLabel">عضو اللجنة</label>-->

    let popupHtml = `
        <div class="popupHeader">
            <div class="violationsCode">
                <p>مخالفة العربة رقم (${ViolationCode})</p>
                <div class="printBtn"><img src="${functions.getSiteName() == "ViolationsRecorder"
            ? "/Style Library/MiningViolations/images/BluePrintBtn.png"
            : "/Style Library/MiningViolations/images/GreenPrintBtn.png"
        }" alt="Print Button"></div>
            </div>
            <div class="backBtn">
                <div class="bootpopup-button close" data-dismiss="modal" aria-label="Close">
                    <a href="#!"> العودة إلى سجل المخالفات ${LogName} <i class="fa-solid fa-angle-left"></i></a>
                </div>
            </div>
        </div>

        <div class="popupFormBoxHeader">
            <p class="formBoxTitle"><span class="formNumber">1</span> تفاصيل المخالفة</p>
        </div>

        <div class="popupBody">
            <div class="popupForm detailsPopupForm" id="detailsPopupForm">

                <div class="formContent">
                    <div class="formBox">
                        <div class="formElements">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="violatorName" class="customLabel">اسم المخالف</label>
                                        <input class="form-control customInput violatorName" id="violatorName" type="text" value="${violationData.ViolatorName
        }" disabled>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-group customFormGroup">
                                        <label for="violatorNationalId" class="customLabel">الرقم القومي للمخالف</label>
                                        <input class="form-control customInput violatorNationalId" id="violatorNationalId" type="text" value="${violationData.NationalID != ""
            ? violationData.NationalID
            : "-"
        }" disabled>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-group customFormGroup">
                                        <label for="prevViolationsCount" class="customLabel">عدد المخالفات السابقة</label>
                                        <input class="form-control customInput prevViolationsCount" id="prevViolationsCount" type="text" value="${violationData.NumOfPreviousViolations
        }" disabled>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="companyName" class="customLabel">الشركة المخالفة التابع لها</label>
                                        <input class="form-control customInput companyName" id="companyName" type="text" value="${violationData.ViolatorCompany != ""
            ? violationData.ViolatorCompany
            : "-"
        }" disabled>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="commercialRegister" class="customLabel">السجل التجاري للشركة</label>
                                        <input class="form-control customInput commercialRegister" id="commercialRegister" type="text" value="${violationData.CommercialRegister != ""
            ? violationData.CommercialRegister
            : "-"
        }" disabled>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="violationGov" class="customLabel">المحافظة</label>
                                        <input class="form-control customInput violationGov" id="violationGov" type="text" value="${violationData.Governrates != null
            ? violationData.Governrates.Title
            : "-"
        }" disabled>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="violationArea" class="customLabel">منطقة الضبط</label>
                                        <input class="form-control customInput violationArea" id="violationArea" type="text" value="${violationData.ViolationsZone
        }" disabled>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="violationCarType" class="customLabel">نوع العربة</label>
                                        <input class="form-control customInput violationCarType" id="violationCarType" type="text" value="${violationData.VehicleType != ""
            ? violationData.VehicleType
            : "-"
        }"  disabled>
                                    </div>
                                </div>
                                <div class="col-md-6 TrailerNumberBox">
                                    <div class="form-group customFormGroup">
                                        <label for="tractorNumber" class="customLabel">رقم المقطورة</label>
                                        <input class="form-control customInput tractorNumber" id="tractorNumber" type="text" value="${violationData.TrailerNum
        }" disabled>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <p class="formSectionLabel ${functions.getSiteName() ==
            "ViolationsRecorder"
            ? "blueSectionLabel"
            : "greenSectionLabel"
        }">* رخصة تسيير مركبة</p>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-group customFormGroup">
                                        <label for="carLicenseFullNumber" class="customLabel">رقم العربة</label>
                                        <input class="form-control customInput carLicenseFullNumber" id="carLicenseFullNumber" type="text" value="${violationData.CarNumber
        }" disabled>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-group customFormGroup">
                                        <label for="carBrand" class="customLabel">النوع</label>
                                        <input class="form-control customInput carBrand" id="carBrand" type="text" value="${violationData.VehicleBrand != ""
            ? violationData.VehicleBrand
            : "-"
        }" disabled>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-group customFormGroup">
                                        <label for="carLicenseColor" class="customLabel">اللون</label>
                                        <input class="form-control customInput carLicenseColor" id="carLicenseColor" type="text" value="${violationData.CarColor != ""
            ? violationData.CarColor
            : "-"
        }"  disabled>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-group customFormGroup">
                                        <label for="carLicenseTraffic" class="customLabel">ترخيص المرور</label>
                                        <input class="form-control customInput carLicenseTraffic" id="carLicenseTraffic" type="text" value="${violationData.TrafficName != "" &&
            violationData.TrafficName != null
            ? violationData.TrafficName
            : "-"
        }" disabled>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <p class="formSectionLabel ${functions.getSiteName() ==
            "ViolationsRecorder"
            ? "blueSectionLabel"
            : "greenSectionLabel"
        }">* رخصة القيادة</p>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="driverLicenseNumber" class="customLabel">رقم رخصة القيادة</label>
                                        <input class="form-control customInput driverLicenseNumber" id="driverLicenseNumber" type="text" value="${violationData.DrivingLicense != ""
            ? violationData.DrivingLicense
            : "-"
        }" disabled>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-group customFormGroup">
                                        <label for="driverLicenseTraffic" class="customLabel">ترخيص المرور</label>
                                        <input class="form-control customInput driverLicenseTraffic" id="driverLicenseTraffic" type="text" value="${violationData.TrafficLicense != ""
            ? violationData.TrafficLicense
            : "-"
        }" disabled>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="hiddenDetailsBox">
                        <div class="formBox">
                            <div class="formElements">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="form-group customFormGroup">
                                            <label for="violationRawType" class="customLabel">نوع الخام</label>
                                            <input class="form-control customInput violationRawType" id="violationRawType" type="text" value="${violationData.Material != null
            ? violationData.Material.Title
            : "-"
        }" disabled>
                                        </div>
                                    </div>
                                    <div class="col-md-6" style="display${violationData.VehicleType ==
            "عربة بمقطورة"
            ? "none"
            : "block"
        }">
                                        <div class="form-group customFormGroup">
                                            <label for="RawQuantity" class="customLabel">كمية الخام</label>
                                            <input class="form-control customInput RawQuantity" id="RawQuantity" type="text" value="${violationData.MaterialAmount !=
            null
            ? violationData.MaterialAmount
            : "-"
        }" disabled>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-group customFormGroup">
                                            <label for="violationDate" class="customLabel">تاريخ الضبط</label>
                                            <div class="inputIconBox">
                                                <input class="form-control customInput inputDate violationDate"
                                                    id="violationDate" type="text" value="${violationDate}" disabled>
                                                <i class="fa-solid fa-calendar-days"></i>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-group customFormGroup">
                                            <label for="violationTime" class="customLabel">وقت الضبط</label>
                                            <div class="inputIconBox">
                                                <input class="form-control customInput timeInput violationTime" id="violationTime" type="text" value="${violationTime}" disabled>
                                                <i class="fa-solid fa-clock"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="formBox">
                            <div class="formElements">
                                <div class="row">
                                    <div class="col-12">
                                        <div class="form-group customFormGroup">
                                            <div class="feildInfoBox">
                                                <label class="customLabel">الإحداثيات</label>
                                                <!--<a href="#!" class="titleLink showOnMapBtn"><i class="fa-solid fa-map-pin"></i> عرض على الخريطة</a>-->
                                            </div>
                                            <div class="coordinatesTable" id="coordinatesTable">
                                                ${Coordinates}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="formBox">
                            <div class="formElements">
                                <div class="row">
                                    <div class="col-md-8 violationsAttachmentsBox">
                                        <div class="feildInfoBox">
                                            <label class="customLabel">المرفقات</label>
                                            <a href="#!" class="titleLink downloadAllFiles">
                                            <i class="fa-solid fa-download"></i> تنزيل الكل</a>
                                        </div>
                                        <div class="attachBox"></div>
                                    </div>
                                    <div class="col-md-4 violationDescriptionBox">
                                        <div class="form-group customFormGroup">
                                            <label for="violationDescription" class="customLabel">وصف المخالفة</label>
                                            <textarea class="form-control violationDescription customTextArea" id="violationDescription" value="${violationData.Description
        }" disabled>${violationData.Description
        }</textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="formBox">
                            <div class="formElements">
                                <div class="row">
                                    <div class="col-12">
                                        <div class="form-group customFormGroup">
                                            <label for="sectorManegrOpinion" class="customLabel">رأي قائد القطاع</label>
                                            <textarea class="form-control sectorManegrOpinion customTextArea" id="sectorManegrOpinion" value="${violationData.LeaderOpinion
        }" disabled>${violationData.LeaderOpinion
        }</textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="formBox CommiteeMembersBox">
                            <div class="formElements">
                                <div class="row">
                                    <div class="col-md-4 recorderBox committeeMembersDataBox">
                                        <div class="form-group customFormGroup">
                                            <textarea class="form-control recorderNameText customTextArea" rows="4" id="recorderNameText" value="${violationData.SectorMembers
        }" disabled>${violationData.SectorMembers
        }</textarea>
                                        </div>
                                    </div>
                                    <div class="col-md-6 memberBox committeeMembersDataBox" style="display:${violationData.CommiteeMember == ""
            ? "none"
            : "block"
        }">
                                        <div class="form-group customFormGroup">
                                            <label for="memberName" class="customLabel">القائمون بالضبط</label>                                           
                                            <textarea class="form-control memberName customTextArea" rows="4" id="memberName" value="${violationData.CommiteeMember
        }" disabled>${violationData.CommiteeMember
        }</textarea>
                                            
                                        </div>
                                    </div>
                                    <div class="col-md-4 leaderBox committeeMembersDataBox" style="display:none">
                                        <div class="form-group customFormGroup">
                                            <label for="leaderName" class="customLabel">قائد القطاع</label>
                                            <input class="form-control customInput leaderName" id="leaderName" type="text" disabled>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="formBox rejectReasonBox">
                            <div class="formElements">
                                <div class="row">
                                    <div class="col-12">
                                        <div class="form-group customFormGroup">
                                            <label for="rejectReason" class="customLabel">سبب الرفض</label>
                                            <textarea class="form-control rejectReason customTextArea" id="rejectReason" disabled></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="formBox addConfirmationAttchBox">
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

                        <div class="formBox totalPriceBox">
                            <div class="formElements">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="form-group customFormGroup">
                                            <div class="feildInfoBox">
                                                <label class="customLabel" for="totalPrice">إجمالي المبلغ المستحق</label>
                                                <a href="#!" class="titleLink showFormula"> تفاصيل حساب المبلغ المستحق</a>
                                            </div>
                                            <div class="inputIconBox">
                                                <input class="form-control customInput ${functions.getSiteName() ==
            "ViolationsRecorder"
            ? "blueInput"
            : "greenInput"
        } totalPrice" id="totalPrice" type="text" value="${functions.splitBigNumbersByComma(
            violationData?.TotalPriceDue,
        )}" disabled>
                                                <span>جنيها</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6 dateLimitBox">
                                        <div class="form-group customFormGroup">
                                            <label class="customLabel">تاريخ مدة نهاية التصالح</label>
                                            <input class="form-control customInput ${functions.getSiteName() ==
            "ViolationsRecorder"
            ? "blueInput"
            : "greenInput"
        } violationEndTime" id="violationEndTime" type="text" disabled>
                                        </div>
                                    </div>
                                    <div class="col-md-6 bankAccountBox">
                                        <div class="form-group customFormGroup">
                                            <label class="customLabel">رقم الحساب البنكي</label>
                                            <input class="form-control customInput ${functions.getSiteName() ==
            "ViolationsRecorder"
            ? "blueInput"
            : "greenInput"
        } bankAccountNumber" id="bankAccountNumber" type="text" value="0074-20316180906-45" disabled>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="formBox confirmationAttachBox">
                            <div class="formElements">
                                <div class="row">
                                    <div class="col-12">
                                        <label class="customLabel">المرفقات</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="showMoreDetails">
                        <div class="moreDetailsInnerBox">
                            <img src="/Style Library/MiningViolations/images/arrowDown.png" alt="Arrow Down">
                            <p>إظهار المزيد من التفاصيل</p>
                        </div>
                    </div>
                    
                </div>

                <div class="formButtonsBox">
                    <div class="col-12">
                        <div class="buttonsBox centerButtonsBox ">
                            <div class="btnStyle confirmBtnGreen popupBtn approveViolation" id="approveViolation">موافقة على المخالفة</div>
                            <div class="btnStyle cancelBtn popupBtn rejectViolation" id="rejectViolation">رفض المخالفة</div>
                            <div class="btnStyle cancelBtn popupBtn payPartPrice" id="payPartPrice">تسديد المخالفة</div>
                            <div class="btnStyle confirmBtnGreen popupBtn payAllPrice" id="payAllPrice">تسديد وإنهاء المخالفة </div>
                            <div class="btnStyle confirmBtnGreen popupBtn confirmViolation" id="confirmViolation">التصديق على المخالفة </div>
                            <div class="btnStyle cancelBtn popupBtn closeDetailsPopup" id="closeDetailsPopup" data-dismiss="modal" aria-label="Close">إغلاق</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="popupFormBoxHeader">
            <p class="formBoxTitle"><span class="formNumber">2</span> تسديد المخالفة</p>
        </div>
`;
    $(".CommiteeMembersBox")
        .find(".memberBox")
        .append(`<div class="testAppend"></div>`);
    $(".overlay").removeClass("active");
    return popupHtml;
};
DetailsPopup.getViolationEquipments = (Equipments, EquipmentsCount) => {
    let equipmentsHtml = $(`
        <div>
            <div class="toolsBox quarryToolsBox"></div>
        </div>
    `);

    // Check if Equipments exists and is an array
    if (Equipments && Array.isArray(Equipments) && Equipments.length > 0) {
        Equipments.forEach((Equipment, index) => {
            let Equipcount = "-";

            // Check if EquipmentsCount exists and has data for this index
            if (EquipmentsCount && EquipmentsCount[index]) {
                Equipcount = EquipmentsCount[index]?.count || "-";
            }

            equipmentsHtml.find(".quarryToolsBox").append(`
                <div class="tool tools-show popupTool">
                    <label class="customelabel checkboxLabel" for="${Equipment.Title}">
                        <input type="checkbox" class="toolInput checkboxInput" value="${Equipment.Title}" name="${Equipment.Title}" id="${Equipment.Title}" disabled>
                        <span class="checkmark"></span>
                        <span class="checktext">${Equipment.Title} [${Equipcount}]</span>
                    </label>
                </div>
            `);
        });
    } else {
        equipmentsHtml.find(".quarryToolsBox").append(`
            <p class="noEquipments">لم يتم إضافة معدات مضبوطة</p>
        `);
    }

    return equipmentsHtml.html();
};
DetailsPopup.getViolationCoords = (Coordinates) => {
    let CoordsHtml = $(`
                        <div>
                            <table class="table table-bordered">
                                <tr class="coordinatesHead">
                                    <th scope="col">م</th>
                                    <th scope="col">شرقيات (E)</th>
                                    <th scope="col">شماليات (N)</th>
                                </tr>
                            </table>
                        </div>
                    `);
    if (Coordinates != "") {
        let splitedCoords = Coordinates.split("],");
        let filteredCoords;
        splitedCoords.forEach((singleCoord, index) => {
            filteredCoords = singleCoord
                .replace(/[^0-9\.]+/g, " ")
                .trim()
                .split(" ");
            CoordsHtml.find("table").append(`
                <tr>
                    <th>${index + 1}</th>
                    <td>
                        <input type="text" class="" value="${filteredCoords[0]
                }" disabled>
                        <input type="text" class="" value="${filteredCoords[1]
                }" disabled>
                        <input type="text" class="" value="${filteredCoords[2]
                }" disabled>
                    </td>
                    <td>
                        <input type="text" class="" value="${filteredCoords[3]
                }" disabled>
                        <input type="text" class="" value="${filteredCoords[4]
                }" disabled>
                        <input type="text" class="" value="${filteredCoords[5]
                }" disabled>
                    </td>
                </tr>
            `);
        });
    } else {
        CoordsHtml.find(".coordinatesHead").hide();
        // CoordsHtml.html("");
        CoordsHtml.find(".table").prepend(`
            <p class="noCoordinates">لا توجد احداثيات</p>
        `);
    }

    return CoordsHtml.html();
};
DetailsPopup.drawCoordinates = (Coords, TypeOfCoords) => {
    let pointLat;
    let pointLng;
    let marker;
    let splitedCoords;
    let firstPoint;
    let filteredFirstPoint;
    let firstArg;
    let secondArg;
    if (TypeOfCoords == "Quarry") {
        splitedCoords = Coords.split("],");
        firstPoint = splitedCoords[0];
        filteredFirstPoint = firstPoint.replace("[[", "").trim().split(",");
        pointLat = filteredFirstPoint[0];
        pointLng = filteredFirstPoint[1];
    } else {
        splitedCoords = Coords.split(",");
        firstArg = splitedCoords[0];
        secondArg = splitedCoords[1];
        pointLat = firstArg.replace("[[", "").trim();
        pointLng = secondArg.replace("]]", "").trim();
    }
    marker = `marker=${pointLat};${pointLng}`;
    return marker;
};
DetailsPopup.getViolationAttachmentsById = (violationID) => {
    let request = {
        id: violationID,
        listName: "Violations",
    };
    $.ajax({
        type: "POST",
        url: "/_layouts/15/Uranium.Violations.SharePoint/Attachments.aspx/Get",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: JSON.stringify(request),
        success: (data) => {
            if (data != null) {
                let attachmentsData = data.d;
                if (attachmentsData.length > 0) {
                    attachmentsData.forEach((attachData) => {
                        $(".attachBox").append(`
                            <a class="attachment" target="_blanck" href="${attachData.Url}" download="${attachData.Url}" title="${attachData.Name}">
                                <div class="attachImgBox">
                                    <img src="/Style Library/MiningViolations/images/file.png" alt="attach Image">
                                </div>
                                <div class="attachDataBox">
                                    <p class="attachName">${attachData.Name}</p>
                                    <span><i class="fa-solid fa-download"></i></span>
                                </div>
                            </a>
                        `);
                    });
                } else {
                    $(".downloadAllFiles").hide();
                    $(".attachBox").append(`
                            <p class="noAttachments">لا يوجد مرفقات</p>
                    `);
                }
            }
        },
        error: (xhr) => { },
    });
};

DetailsPopup.getConfirmationAttachments = (TaskId) => {
    let request = {
        id: TaskId,
        listName: "ViolationsCycle",
    };
    $.ajax({
        type: "POST",
        url: "/_layouts/15/Uranium.Violations.SharePoint/Attachments.aspx/Get",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: JSON.stringify(request),
        success: (data) => {
            if (data != null) {
                let attachmentsData = data.d;
                if (attachmentsData.length > 0) {
                    attachmentsData.forEach((attachData) => {
                        $(".confirmationAttachBox").find(".row").append(`
                            <div class="col-md-6">
                                <a class="attchedFile" target="_blanck" href="${attachData.Url}" download="${attachData.Url}" title="${attachData.Name}">
                                    <div class="attachDetailsBox">
                                        <img src="/Style Library/MiningViolations/images/smallFile.png" alt="attach Image">
                                        <p class="attchedFileName">${attachData.Name}</p>
                                    </div>
                                    <span><i class="fa-solid fa-download"></i></span>
                                </a>
                            </div>
                        `);
                    });
                } else {
                    $(".downloadAllFiles").hide();
                    $(".confirmationAttachBox").find(".row").append(`
                        <div class="col-12">
                            <p class="noAttachedFiles">لا يوجد مرفقات</p>
                        </div>
                    `);
                }
            }
        },
        error: (xhr) => { },
    });
};

///////////////////////////////////////////////////////
DetailsPopup.getCommitteeRecorder = (SectorConfigId) => {
    let request = {
        Id: SectorConfigId,
    };
    functions
        .requester(
            "_layouts/15/Uranium.Violations.SharePoint/Configurations.aspx/FindbyId",
            request,
        )
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
        })
        .then((data) => {
            let User = data.d;

            $(".customFormGroup").find(".sectorRecorder").append(`${User.NameAr}`);

            $(".CommiteeMembersBox")
                .find(".recorderBox")
                .find(".recorderName")
                .val(`${User.Rank} / ${User.Title}`);
            // DetailsPopup.getCommitteeManager(User.SectorLeader)
        })
        .catch((err) => { });
};

DetailsPopup.printPaymentForm = (TaskData) => {
    console.log('TaskData print', TaskData)

    let violationData = TaskData.Violation != null ? TaskData.Violation : "---";
    let PrintedCount = TaskData.PrintedCount;
    let offenderType = violationData.OffenderType;
    let ExDate = functions.getFormatedDate(TaskData?.ReconciliationExpiredDate);
    let violationPriceType =
        violationData.ViolationTypes != null
            ? violationData.ViolationTypes.PriceType
            : "";
    let TotalViolationPrice = violationData.TotalPriceDue;
    let RoyaltyPrice = violationData.LawRoyalty;
    let QuarryMaterialValue = violationData.QuarryMaterialValue;
    // let FinesValue = violationData.TotalPriceDue;
    let violationTypeLastPrice;
    let labelText;
    let inputVal;
    let ExpirationDate;

    if (offenderType == "Quarry" || offenderType == "Equipment") {
        violationTypeLastPrice = DetailsPopup.getQuarryViolationValueByType(
            violationPriceType,
            TotalViolationPrice,
            QuarryMaterialValue,
        );
        labelText = violationTypeLastPrice.labelText;
        inputVal = violationTypeLastPrice.InputVal;
        if (PrintedCount == 0) {
            ExpirationDate = functions.getCurrentDateTime("DateTime");
            // ExpirationDate = functions.getNDaysAfterCurrentDate(30)
        } else {
            ExpirationDate = ExDate;
        }
    } else {
        violationTypeLastPrice = DetailsPopup.getVechileViolationValueByType(
            TotalViolationPrice,
            RoyaltyPrice,
        );
        labelText = violationTypeLastPrice.labelText;
        inputVal = violationTypeLastPrice.InputVal;
        if (PrintedCount == 0) {
            ExpirationDate = functions.getCurrentDateTime("DateTime");
            // ExpirationDate = functions.getNDaysAfterCurrentDate(15)
        } else {
            ExpirationDate = ExDate;
        }
    }
    let printPaymentFormHtml = `
    <div class="paymentFormPrintBox" id="printJS-form">
        <div class="popupBigWrapper">

            <div class="popupSectionWrapper">
                <div class="WaterMark">
                    <img src="/Style Library/MiningViolations/images/WaterMarkL.png" alt="Water Mark">
                </div>
                <div class="formTitle">مطالبة مالية (${functions.getViolationArabicName(
        offenderType,
    )})</div>
                <div class="popupHeader">
                    <div class="violationsMetaBox">
                        <p class="violationCode">${functions.getViolationPaymentArabicName(
        offenderType,
    )} (${violationData.ViolationCode})</p>
                        <p class="violationPrintTime">${PrintedCount == 0
            ? "تاريخ وتوقيت الطباعة :" + ExpirationDate
            : "تاريخ انتهاء فترة التصالح :" + ExpirationDate
        }</p>
                    </div>
                </div>

                <div class="popupBody violationPrintFormBody violationPricesBody">
                    <div class="popupForm printPaymentPricesDetailsPopup" id="printPaymentPricesDetailsPopup">
                        <div class="formContent">

                            <div class="payRowData">
                                <div class="row">
                                    <div class="col-md-3">
                                        <div class="headOfSection">
                                            <p class="SectionTitle">بيانات المخالفة الأساسية :</p>
                                        </div>
                                    </div>
                                    <div class="col-md-9">
                                        <div class="formBox">
                                            <div class="formElements">
                                                <div class="row">
                                                    <div class="col-md-4">
                                                        <div class="form-group customFormGroup">
                                                            <label for="violatorName" class="customLabel">اسم المخالف</label>
                                                            <input class="form-control customInput violatorName" id="violatorName" type="text" value="${violationData.ViolatorName
        }" disabled>
                                                        </div>
                                                    </div>
                                                    <div class="col-md-4">
                                                        <div class="form-group customFormGroup">
                                                            <label for="companyName" class="customLabel">اسم الشركة المخالفة</label>
                                                            <input class="form-control customInput companyName" id="companyName" type="text" value="${violationData.ViolatorCompany !=
            ""
            ? violationData.ViolatorCompany
            : "-"
        }" disabled>
                                                        </div>
                                                    </div>
                                                    <div class="col-md-4">
                                                        <div class="form-group customFormGroup">
                                                            <label for="violationType" class="customLabel">نوع المخالفة</label>
                                                            <input class="form-control customInput violationType" id="violationType" type="text" value="${violationData.ViolationTypes !=
            null
            ? functions.getViolationArabicName(
                violationData.OffenderType,
            )
            : "-"
        }" disabled>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="row">
                                                    <div class="col-md-4">
                                                        <div class="form-group customFormGroup">
                                                            <label for="violatorName" class="customLabel">الكمية (${violationData?.MaterialUnit === "طن" ? "طن" : violationData?.MaterialUnit === "متر مكعب" ? "للمتر المكعب" : "للمتر المكعب / الطن"})</label>
                                                            <input class="form-control customInput violatorName" id="violatorName" type="text" value="${violationData?.TotalQuantity !=
            ""
            ? violationData?.TotalQuantity
            : "-"
        }" disabled>
                                                        </div>
                                                    </div>
                                                    <div class="col-md-4">
                                                        <div class="form-group customFormGroup">
                                                            <label for="violatorName" class="customLabel">قيمة الوحدة (${violationData?.MaterialUnit === "طن" ? "طن" : violationData?.MaterialUnit === "متر مكعب" ? "للمتر المكعب" : "للمتر المكعب / الطن"})</label>
                                                            <input class="form-control customInput violatorName" id="violatorName" type="text" value="${violationData?.MaterialUnit !=
            ""
            ? violationData?.MaterialUnit
            : "-"
        }" disabled>
                                                        </div>
                                                    </div>
                                                    <div class="col-md-4">
                                                        <div class="form-group customFormGroup">
                                                            <label for="violatorName" class="customLabel">قيمة المعدات</label>
                                                            <input class="form-control customInput violatorName" id="violatorName" type="text" value="${violationData?.TotalEquipmentsPrice !=
            ""
            ? violationData?.TotalEquipmentsPrice
            : "-"
        }" disabled>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="payRowData">
                                <div class="row">
                                    <div class="col-md-3">
                                        <div class="headOfSection">
                                            <p class="SectionTitle">القيمة المالية المستحقة :</p>
                                        </div>
                                    </div>
                                    <div class="col-md-9">
                                        <div class="formBox">
                                            <div class="formElements">
                                                <div class="row">
                                                    <div class="col-md-4">
                                                        <div class="form-group customFormGroup">
                                                            <label class="customLabel" for="quarryPrice">${labelText}</label>
                                                            <div class="inputIconBox">
                                                                <input class="form-control customInput quarryPrice" id="quarryPrice" type="text" value="${inputVal > 0
            ? functions.splitBigNumbersByComma(
                inputVal,
            )
            : "-"
        }" disabled>
                                                                <span class="currency">جنيها</span>
                                                            </div>
                                                            <span class="hint">يسدد بإيصال منفصل</span>
                                                        </div>
                                                    </div>
                                                    <div class="col-md-4">
                                                        <div class="form-group customFormGroup">
                                                            <label class="customLabel" for="royaltyPrice">قيمة الإتاوة (${violationData?.MaterialUnit === "طن" ? "طن" : violationData?.MaterialUnit === "متر مكعب" ? "للمتر المكعب" : "للمتر المكعب / الطن"})</label>
                                                            <div class="inputIconBox">
                                                                <input class="form-control customInput royaltyPrice" id="royaltyPrice" type="text" value="${violationData?.LawRoyalty >
            0
            ? functions.splitBigNumbersByComma(
                violationData?.LawRoyalty,
            )
            : "-"
        }" disabled>
                                                                <span class="currency">جنيها</span>
                                                            </div>
                                                            <span class="hint">يسدد بإيصال منفصل</span>
                                                        </div>
                                                    </div>
                                                    <div class="col-md-4">
                                                        <div class="form-group customFormGroup">
                                                            <label class="customLabel" for="quarryPrice">إجمالي المبلغ</label>
                                                            <div class="inputIconBox">
                                                                <input class="form-control customInput quarryPrice" id="quarryPrice" type="text" value="${violationData?.TotalPriceDue >
            0
            ? functions.splitBigNumbersByComma(
                violationData?.TotalPriceDue,
            )
            : "-"
        }" disabled>
                                                                <span class="currency">جنيها</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="payRowData">
                                <div class="row">
                                    <div class="col-md-3">
                                        <div class="headOfSection">
                                            <p class="SectionTitle">تعليمات السداد :</p>
                                        </div>
                                    </div>
                                    <div class="col-md-9">
                                        <div class="formBox">
                                            <div class="formElements">
                                                <div class="row">
                                                    <div class="col-md-4">
                                                        <div class="form-group customFormGroup">
                                                            <label class="customLabel" for="bankAccountNumber">رقم الحساب البنكي</label>
                                                            <div class="inputIconBox">
                                                                <input class="form-control customInput bankAccountNumber" id="bankAccountNumber" type="text" value="0074-20316180906-45" disabled>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="col-md-8">
                                                        <div class="instructionsBox">
                                                            <p class="paymentInstructions">لا يعتد به كمستند رسمي ودون أدنى مسؤولية على الشركة</p>
                                                            <!-- <p class="paymentInstructions">أقصى مدة لسداد القيمة المالية <span class="payPeriod">(${offenderType ==
            "Quarry"
            ? "30 يوم"
            : "15 يوم"
        })</span> من استلام المطالبة المالية</p> -->
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            <div class="cutPaperBox">
                <div class="cutLine">
                    <img src="/Style Library/MiningViolations/images/cutIcon.svg" class="cutImage"></img>
                </div>
            </div>

            <div class="popupSectionWrapper">    
                <div class="WaterMark">
                    <img src="/Style Library/MiningViolations/images/WaterMarkL.png" alt="Water Mark">
                </div> 
                <div class="formTitle">بــيان مخالفة ${offenderType == "Quarry"
            ? "محجر"
            : offenderType == "Vehicle"
                ? "عربة"
                : offenderType == "Equipment"
                    ? "معدة"
                    : "-"
        }</div>       
                <div class="popupHeader">
                    <div class="violationsMetaBox"> 
                        <p class="violationCode">${offenderType == "Quarry"
            ? `تفاصيل مخالفة المحجر رقم (${violationData.ViolationCode})`
            : offenderType == "Vehicle"
                ? `تفاصيل مخالفة العربة رقم (${violationData.ViolationCode})`
                : offenderType == "Equipment"
                    ? `تفاصيل مخالفة المعدة رقم (${violationData.ViolationCode})`
                    : ""
        }</p>
                        <p class="violationPrintTime"></p>
                    </div>
                </div>

                <div class="popupBody violationPrintFormBody violationDetailsBody">
                    <div class="popupForm printPaymentDetailsPopup" id="printPaymentDetailsPopup">
                        <div class="formContent">
                            ${offenderType == "Quarry" ||
            offenderType == "Equipment"
            ? DetailsPopup.quarryPaymentDetails(
                violationData,
            )
            : DetailsPopup.vehiclePaymentDetails(
                violationData,
            )
        }
                        </div>
                    </div>
                </div>
            </div>

        </div>

        <div class="row">
            <div class="col-md-12">
                <div class="formButtonsBox">
                    <div class="col-12">
                        <div class="buttonsBox centerButtonsBox ">
                            <div class="btnStyle confirmBtnGreen popupBtn printPaymentFormBtn" id="printPaymentFormBtn" data-dismiss="modal" aria-label="Close">طباعة نموذج السداد</div>
                            <div class="btnStyle confirmBtnGreen popupBtn printConfirmationForm" id="printConfirmationForm">طباعة نموذج التصديق</div>
                            <div class="btnStyle cancelBtn popupBtn closePrintPaymentDetailsPopup" id="closePrintPaymentDetailsPopup" data-dismiss="modal" aria-label="Close">إلغاء</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </div>`;
    // <!--<div class="btnStyle confirmBtnGreen popupBtn printPaymentForm" id="printPaymentForm">طباعة نموذج السداد</div>-->
    return printPaymentFormHtml;
};

DetailsPopup.quarryPaymentDetails = (violationData) => {
    DetailsPopup.getCommitteeRecorder(violationData.SectorConfigId);
    let violationDate = functions.getFormatedDate(
        violationData?.ViolationDate,
        "DD-MM-YYYY",
    );
    let violationTime = functions.getFormatedDate(
        violationData?.ViolationTime,
        "hh:mm A",
    );
    let ViolationTypesData = violationData.ViolationTypes;

    let Equipments = DetailsPopup.getViolationEquipments(
        violationData.Equipments,
        violationData.Equipments_Count,
    );
    let Coordinates = DetailsPopup.getViolationCoords(
        violationData.CoordinatesDegrees,
    );
    let marker = DetailsPopup.drawCoordinates(
        violationData.Coordinates,
        "Quarry",
    );
    let dataHtml = `
        <div class="formBox">
            <div class="formElements">
                <div class="row">
                    <div class="col-md-3">
                        <div class="form-group customFormGroup">
                            <label for="violatorName" class="customLabel">اسم المخالف</label>
                            <input class="form-control customInput violatorName" id="violatorName" type="text" value="${violationData.ViolatorName
        }" disabled>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="form-group customFormGroup">
                            <label for="violatorNationalId" class="customLabel">الرقم القومي</label>
                            <input class="form-control customInput violatorNationalId" id="violatorNationalId" type="text" value="${violationData.NationalID != ""
            ? violationData.NationalID
            : "-"
        }" disabled>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="form-group customFormGroup">
                            <label for="prevViolationsCount" class="customLabel">المخالفات السابقة</label>
                            <input class="form-control customInput prevViolationsCount" id="prevViolationsCount" type="text" value="${violationData.NumOfPreviousViolations
        }" disabled>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="form-group customFormGroup">
                            <label for="companyName" class="customLabel">الشركة المخالفة</label>
                            <input class="form-control customInput companyName" id="companyName" type="text" value="${violationData.ViolatorCompany != ""
            ? violationData.ViolatorCompany
            : "-"
        }" disabled>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="form-group customFormGroup">
                            <label for="commercialRegister" class="customLabel">السجل التجاري</label>
                            <input class="form-control customInput commercialRegister" id="commercialRegister" type="text" value="${violationData.CommercialRegister != ""
            ? violationData.CommercialRegister
            : "-"
        }" disabled>
                        </div>
                    </div>
                    <div class="col-md-3"> 
                        <div class="form-group customFormGroup">
                            <label for="violationArea" class="customLabel">منطقة الضبط</label>
                            <input class="form-control customInput violationArea" id="violationArea" type="text" value="${violationData.ViolationsZone
        }" disabled>
                        </div>
                    </div>
                    <div class="col-md-2"> 
                        <div class="form-group customFormGroup">     
                            <label for="violationGov" class="customLabel">المحافظة</label> 
                            <input class="form-control customInput violationGov" id="violationGov" type="text" value="${violationData.Governrates != null
            ? violationData.Governrates?.Title
            : "-"
        }" disabled>
                        </div>
                    </div>
                    <div class="col-md-4"> 
                        <div class="form-group customFormGroup">     
                            <label for="violationType" class="customLabel">نوع المخالفة</label> 
                            <input class="form-control customInput violationType" id="violationType" type="text" value="${violationData.ViolationTypes != null
            ? violationData.ViolationTypes?.Title
            : "-"
        }" disabled>
                        </div>
                    </div>
                    <div class="col-md-3 BonesBox" style="display:${ViolationTypesData?.Title == "اصدار بونات فارغة" ||
            ViolationTypesData?.Title == "بيع بونات" ||
            ViolationTypesData?.Title == "استخدام بونات الغير" ||
            ViolationTypesData?.Title == "تلاعب ببيانات البونات"
            ? "block !important"
            : "none !important"
        }"> 
                        <div class="form-group customFormGroup">     
                            <label for="BonesCount" class="customLabel">عدد البونات</label> 
                            <input class="form-control customInput BonesCount" id="BonesCount" type="text" value="${violationData.BonsNumber
        }" disabled>
                        </div>
                    </div>
                    <div class="col-md-3"> 
                        <div class="form-group customFormGroup">     
                            <label for="violationRawType" class="customLabel">نوع الخام</label> 
                            <input class="form-control customInput violationRawType" id="violationRawType" type="text" value="${violationData.Material != null
            ? violationData.Material?.Title
            : "-"
        }" disabled>
                        </div>
                    </div>
                    <div class="col-md-3"> 
                        <div class="form-group customFormGroup">     
                            <label for="quarryCode" class="customLabel">رقم المحجر</label> 
                            <input class="form-control customInput quarryCode" id="quarryCode" type="text" value="${violationData.QuarryCode
        }" disabled>
                        </div>
                    </div>
                    <div class="col-md-2"> 
                        <div class="form-group customFormGroup">     
                            <label for="quarryType" class="customLabel">نوع المحجر</label> 
                            <input class="form-control customInput quarryType" id="quarryType" type="text" value="${violationData.QuarryType
        }" disabled>
                        </div>
                    </div>
                    <div class="col-md-2"> 
                        <div class="form-group customFormGroup">     
                            <label for="violationDate" class="customLabel">تاريخ الضبط</label> 
                            <input class="form-control customInput violationDate" id="violationDate" type="text" value="${violationDate}" disabled>
                        </div>
                    </div>
                    <div class="col-md-2"> 
                        <div class="form-group customFormGroup">     
                            <label for="violationTime" class="customLabel">وقت الضبط</label> 
                            <input class="form-control customInput violationTime" id="violationTime" type="text" value="${violationTime}" disabled>
                        </div>
                    </div>
                    <div class="col-12">
                        <div class="form-group customFormGroup">
                            <label class="customLabel">ضبط معدات</label>
                            ${Equipments}
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group customFormGroup">
                            <label class="customLabel">الإحداثيات</label>
                            <div class="coordinatesTable" id="coordinatesTable">
                                ${Coordinates}
                            </div>
                        </div>
                    </div>    
                    <div class="col-md-3">
                        <div class="form-group customFormGroup">
                            <label class="customLabel">القطاع القائم بالضبط</label>
                            <div class="form-control customInput sectorRecorder">
                            </div>
                        </div>
                    </div>    
                    <div class="col-md-3">
                        <div class="form-group customFormGroup">
                            <label class="customLabel">القائمون بالضبط</label>
                            <div class="form-control customInput" style="height:100% !important">
                                ${violationData.CommiteeMember}
                            </div>
                        </div>
                    </div>    

                    <!--<div class="col-md-6 ShowOnMapBox" style="display:block !important">
                        <div class="form-group customFormGroup">
                            <label class="customLabel">الموقع على الخريطة</label>
                            <div class="coordinatesMap" id="coordinatesMap">
                                <div class="embed-container">
                                    <iframe width="500" height="400" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" title="World Bank Map" src="//www.arcgis.com/apps/Embed/index.html?webmap=051417efba8a4a14ac04ef195beb3b05&extent=26.6843,26.2561,33.4299,29.5516&zoom=false&previewImage=false&scale=false&disable_scroll=true&theme=light&${marker}"></iframe>
                                </div>
                            </div>
                        </div>
                    </div>-->
                    <div class="col-12">
                        <div class="form-group customFormGroup">
                            <div class="payFormCommentsBox">
                                <label class="customLabel">الملاحظات</label>
                                <textarea class="customTextArea" disabled></textarea>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="form-group customFormGroup">
                            <div class="managerSignatureBox">
                                <p class="managerSignatureContent">التوقيع/ </p>
                                <p class="managerSignatureTitle">رئيس فرع المخالفات</p>
                                
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="form-group customFormGroup">
                            <div class="managerSignatureBox">
                                <p class="managerSignatureContent">التوقيع/ </p>
                                <p class="managerSignatureTitle">مدير إدارة المحاجر</p>
                            </div>
                        </div>
                      
                    </div>
                    <div class="col-md-4">
                        <div class="form-group customFormGroup mt-5">
                            <div class="managerSignatureBox">
                                <p class="managerSignatureContent">يعتمد</p>
                                <p class="managerSignatureContent">التوقيع/ </p>
                                <p class="managerSignatureTitle">  لواء ا.ح/هشام خلف محمد <br>مدير عام الشركة المصرية للتعدين </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    return dataHtml;
};
DetailsPopup.vehiclePaymentDetails = (violationData) => {
    DetailsPopup.getCommitteeRecorder(violationData.SectorConfigId);
    let violationDate = functions.getFormatedDate(
        violationData?.ViolationDate,
        "DD-MM-YYYY",
    );
    let violationTime = functions.getFormatedDate(
        violationData?.ViolationTime,
        "hh:mm A",
    );
    // let Equipments = DetailsPopup.getViolationEquipments(violationData.Equipments)
    let Coordinates = DetailsPopup.getViolationCoords(
        violationData.CoordinatesDegrees,
    );
    let marker = DetailsPopup.drawCoordinates(
        violationData.Coordinates,
        "Vehicle",
    );
    let dataHtml = `
        <div class="formBox">
            <div class="formElements">
                <div class="row">
                    <div class="col-md-3">
                        <div class="form-group customFormGroup">
                            <label for="violatorName" class="customLabel">اسم المخالف</label>
                            <input class="form-control customInput violatorName" id="violatorName" type="text" value="${violationData.ViolatorName
        }" disabled>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="form-group customFormGroup">
                            <label for="violatorNationalId" class="customLabel">الرقم القومي</label>
                            <input class="form-control customInput violatorNationalId" id="violatorNationalId" type="text" value="${violationData.NationalID != ""
            ? violationData.NationalID
            : "-"
        }" disabled>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="form-group customFormGroup">
                            <label for="prevViolationsCount" class="customLabel">المخالفات السابقة</label>
                            <input class="form-control customInput prevViolationsCount" id="prevViolationsCount" type="text" value="${violationData.NumOfPreviousViolations
        }" disabled>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="form-group customFormGroup">
                            <label for="companyName" class="customLabel">الشركة المخالفة</label>
                            <input class="form-control customInput companyName" id="companyName" type="text" value="${violationData.ViolatorCompany != ""
            ? violationData.ViolatorCompany
            : "-"
        }" disabled>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="form-group customFormGroup">
                            <label for="commercialRegister" class="customLabel">السجل التجاري</label>
                            <input class="form-control customInput commercialRegister" id="commercialRegister" type="text" value="${violationData.CommercialRegister != ""
            ? violationData.CommercialRegister
            : "-"
        }" disabled>
                        </div>
                    </div>
                    <div class="col-md-3"> 
                        <div class="form-group customFormGroup">
                            <label for="violationArea" class="customLabel">منطقة الضبط</label>
                            <input class="form-control customInput violationArea" id="violationArea" type="text" value="${violationData.ViolationsZone
        }" disabled>
                        </div>
                    </div>
                    <div class="col-md-2"> 
                        <div class="form-group customFormGroup">     
                            <label for="violationGov" class="customLabel">المحافظة</label> 
                            <input class="form-control customInput violationGov" id="violationGov" type="text" value="${violationData.Governrates != null
            ? violationData.Governrates.Title
            : "-"
        }" disabled>
                        </div>
                    </div>
                    <div class="col-md-2"> 
                        <div class="form-group customFormGroup">
                            <label for="violationCarType" class="customLabel">نوع العربة</label>
                            <input class="form-control customInput violationCarType" id="violationCarType" type="text" value="${violationData.VehicleType
        }" disabled>
                        </div>
                    </div>
                    <div class="col-md-3 tractorBox" style="display:${violationData.VehicleType == "عربة بمقطورة"
            ? "block !important"
            : "none !important"
        }"> 
                        <div class="form-group customFormGroup">
                            <label for="tractorNumber" class="customLabel">رقم المقطورة</label>
                            <input class="form-control customInput tractorNumber" id="tractorNumber" type="text" value="${violationData.TrailerNum
        }" disabled>
                        </div>
                    </div>
                    <div class="col-md-3"> 
                        <div class="form-group customFormGroup">
                            <label for="carLicenseNumber" class="customLabel">رقم المركبة</label>
                            <input class="form-control customInput carLicenseNumber" id="carLicenseNumber" type="text" value="${violationData.CarNumber != ""
            ? violationData.CarNumber
            : "-"
        }" disabled>
                        </div>
                    </div>
                    <div class="col-md-2"> 
                        <div class="form-group customFormGroup">
                            <label for="carLicenseTraffic" class="customLabel">مرور المركبة</label>
                            <input class="form-control customInput carLicenseTraffic" id="carLicenseTraffic" type="text" value="${violationData.TrafficName != "" &&
            violationData.TrafficName != null
            ? violationData.TrafficName
            : "-"
        }" disabled>
                        </div>
                    </div>
                    <div class="col-md-3"> 
                        <div class="form-group customFormGroup">
                            <label for="carBrand" class="customLabel">نوع المركبة</label>
                            <input class="form-control customInput carBrand" id="carBrand" type="text" value="${violationData.VehicleBrand != ""
            ? violationData.VehicleBrand
            : "-"
        }" disabled>
                        </div>
                    </div>
                    <div class="col-md-2"> 
                        <div class="form-group customFormGroup">
                            <label for="carLicenseColor" class="customLabel">لون المركبة</label>
                            <input class="form-control customInput carLicenseColor" id="carLicenseColor" type="text" value="${violationData.CarColor != ""
            ? violationData.CarColor
            : "-"
        }" disabled>
                        </div>
                    </div>
                    <div class="col-md-2" style="display:${violationData.VehicleType == "عربة بمقطورة"
            ? "none"
            : "block"
        }"> 
                        <div class="form-group customFormGroup">     
                            <label for="RawQuantity" class="customLabel">كمية الخام</label> 
                            <input class="form-control customInput RawQuantity" id="RawQuantity" type="text" value="${violationData.MaterialAmount
        }" disabled>
                        </div>
                    </div>
                    <div class="col-md-3"> 
                        <div class="form-group customFormGroup">     
                            <label for="violationRawType" class="customLabel">نوع الخام</label> 
                            <input class="form-control customInput violationRawType" id="violationRawType" type="text" value="${violationData.Material != null
            ? violationData.Material.Title
            : "-"
        }" disabled>
                        </div>
                    </div>
                    <div class="col-md-2"> 
                        <div class="form-group customFormGroup">
                            <label for="driverLicenseNumber" class="customLabel">رخصة السائق</label>
                            <input class="form-control customInput driverLicenseNumber" id="driverLicenseNumber" type="text" value="${violationData.DriverLicense != ""
            ? violationData.DriverLicense
            : "-"
        }" disabled>
                        </div>
                    </div>
                    <div class="col-md-3"> 
                        <div class="form-group customFormGroup">
                            <label for="carLicenseTraffic" class="customLabel">مرور السائق</label>
                            <input class="form-control customInput carLicenseTraffic" id="carLicenseTraffic" type="text" value="${violationData.TrafficLicense != ""
            ? violationData.TrafficLicense
            : "-"
        }" disabled>
                        </div>
                    </div>
                    <div class="col-md-2"> 
                        <div class="form-group customFormGroup">     
                            <label for="violationDate" class="customLabel">تاريخ الضبط</label> 
                            <input class="form-control customInput violationDate" id="violationDate" type="text" value="${violationDate}" disabled>
                        </div>
                    </div>
                    <div class="col-md-2"> 
                        <div class="form-group customFormGroup">     
                            <label for="violationTime" class="customLabel">وقت الضبط</label> 
                            <input class="form-control customInput violationTime" id="violationTime" type="text" value="${violationTime}" disabled>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group customFormGroup">
                            <label class="customLabel">الإحداثيات</label>
                            <div class="coordinatesTable" id="coordinatesTable">
                                ${Coordinates}
                            </div>
                        </div>
                    </div>    
                    <div class="col-md-3">
                        <div class="form-group customFormGroup">
                            <label class="customLabel">القطاع القائم بالضبط</label>
                            <div class="form-control customInput sectorRecorder">
                            </div>
                        </div>
                    </div>    
                    <div class="col-md-3">
                        <div class="form-group customFormGroup">
                            <label class="customLabel">القائمون بالضبط</label>
                            <div class="form-control customInput" style="height:100% !important">
                                ${violationData.CommiteeMember}
                            </div>
                        </div>
                    </div>  
                    <!--<div class="col-md-6 ShowOnMapBox" style="display:block !important">
                        <div class="form-group customFormGroup">
                            <label class="customLabel">الموقع على الخريطة</label>
                            <div class="coordinatesMap" id="coordinatesMap">
                                <div class="embed-container">
                                    <iframe width="500" height="400" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" title="World Bank Map" src="//www.arcgis.com/apps/Embed/index.html?webmap=051417efba8a4a14ac04ef195beb3b05&extent=26.6843,26.2561,33.4299,29.5516&zoom=false&previewImage=false&scale=false&disable_scroll=true&theme=light&${marker}"></iframe>
                                </div>
                            </div>
                        </div>
                    </div>-->
                    <div class="col-12">
                        <div class="form-group customFormGroup">
                            <div class="payFormCommentsBox">
                                <label class="customLabel">الملاحظات</label>
                                <textarea class="customTextArea" disabled></textarea>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                    <div class="form-group customFormGroup">
                        <div class="managerSignatureBox">
                            <p class="managerSignatureContent">التوقيع/ </p>
                            <p class="managerSignatureTitle">رئيس فرع المخالفات</p>
                            
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="form-group customFormGroup">
                        <div class="managerSignatureBox">
                            <p class="managerSignatureContent">التوقيع/ </p>
                            <p class="managerSignatureTitle">مدير إدارة المحاجر</p>
                        </div>
                    </div>
                  
                </div>
                <div class="col-md-4">
                    <div class="form-group customFormGroup mt-5">
                        <div class="managerSignatureBox">
                            <p class="managerSignatureContent">يعتمد</p>
                            <p class="managerSignatureContent">التوقيع/ </p>
                            <p class="managerSignatureTitle">  لواء ا.ح/هشام خلف محمد <br>مدير عام الشركة المصرية للتعدين </p>
                        </div>
                    </div>
                </div>
              
                
                </div>
            </div>
        </div>
    `;
    return dataHtml;
};

DetailsPopup.getQuarryViolationValueByType = (
    violationPriceType,
    TotalPrice,
    QuarryMaterialValue,
) => {
    let violationValueDetails = {};
    let labelText;
    let InputVal;
    if (violationPriceType == "fixed" || violationPriceType == "store") {
        labelText = "قيمة المخالفة المحددة";
        InputVal = TotalPrice;
    } else {
        labelText = "قيمة المادة المحجرية";
        InputVal = QuarryMaterialValue;
    }
    violationValueDetails = {
        labelText: labelText,
        InputVal: InputVal,
    };
    return violationValueDetails;
};
DetailsPopup.getVechileViolationValueByType = (
    TotalViolationPrice,
    RoyaltyPrice,
) => {
    let violationValueDetails = {};
    let labelText = "قيمة مخالفة العربة";
    let InputVal = TotalViolationPrice - RoyaltyPrice;
    violationValueDetails = {
        labelText: labelText,
        InputVal: InputVal,
    };
    return violationValueDetails;
};

export default DetailsPopup;

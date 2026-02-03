import Swal from "sweetalert2";
import functions from "../../Shared/functions";
import sharedApis from "../../Shared/sharedApiCall";

let carViolation = {}
var urlParams = new URLSearchParams(window.location.search);
var editViolationId;
carViolation.violatorDetails = () => {
    let vaildViolator = false;
    let violatorDetails = {}
    let violatorNameCheck = functions.getNameInTriple("#violatorName");
    let violatorName = $("#violatorName").val();
    let violatorNationalId = $("#violatorNationalId").val();
    let violationPrevCount = $("#prevViolationsCount").val();
    let violationGov = $("#violationGov").children("option:selected").val();
    let violationGovId = $("#violationGov").children("option:selected").data("id");
    let violationArea = $("#violationArea").val();
    // let violationAreaName = $("#violationArea").children("option:selected").data("areaname");
    let companyName = $("#companyName").val();
    let commercialRegister = $("#commercialRegister").val()
    let carType = $("#violationCarType").children("option:selected").val()
    // let TractorNumber = $(".tractorBox").is(":visible") && carType == "عربة بمقطورة"?$("#tractorNumber").val():"";
    let NationalIdRegExp = /^(2|3)[0-9][0-9][0-1][0-9][0-3][0-9](01|02|03|04|11|12|13|14|15|16|17|18|19|21|22|23|24|25|26|27|28|29|31|32|33|34|35|88)\d\d\d\d\d$/;
    if (violatorNameCheck) {
        // if(violatorNationalId != "" & NationalIdRegExp.test(violatorNationalId)){        
        if (violationPrevCount != "") {
            // if (companyName != "") {
            if (violationGov != "") {
                if (violationArea != "") {
                    if (carType != "" && carType == "عربة فردي") {
                        // if (carType != "" && carType == "عربة فردي" && $("#unmarkedCheckbox:checked").length == 0) {
                        violatorDetails = {
                            violatorName: violatorName,
                            violatorNationalId: violatorNationalId != "" ? violatorNationalId : "",
                            violationPrevCount: Number(violationPrevCount),
                            violationGov: violationGovId,
                            // violationAreaCode:violationArea,
                            violationAreaName: violationArea,
                            companyName: companyName != "" ? companyName : "",
                            commercialRegister: commercialRegister != "" ? commercialRegister : "",
                            carType: carType,
                        }
                        vaildViolator = true;
                    } else if (carType != "" && carType == "عربة بمقطورة" && $(".tractorBox").is(":visible")) {
                        // } else if (carType != "" && carType == "عربة بمقطورة" && $(".tractorBox").is(":visible") && $("#unmarkedCheckbox:checked").length == 0) {
                        let TractorLetters = $("#tractorLetters").val()
                        let TractorNumbers = $("#tractorNumbers").val()
                        if ((TractorLetters.length > 0 && TractorLetters.trim().length > 0) || $("#unmarkedCheckbox:checked").length != 0) {
                            if ((TractorNumbers.length > 0 && TractorNumbers.length > 0) || $("#unmarkedCheckbox:checked").length != 0) {
                                let TractorFullNumber = TractorLetters + " " + TractorNumbers;
                                violatorDetails = {
                                    violatorName: violatorName,
                                    violatorNationalId: violatorNationalId != "" ? violatorNationalId : "",
                                    violationPrevCount: Number(violationPrevCount),
                                    violationGov: violationGovId,
                                    // violationAreaCode:violationArea,
                                    violationAreaName: violationArea,
                                    companyName: companyName != "" ? companyName : "",
                                    commercialRegister: commercialRegister != "" ? commercialRegister : "",
                                    carType: carType,
                                    TractorNumber: TractorFullNumber,
                                }
                                vaildViolator = true;
                            } else {
                                functions.warningAlert("من فضلك قم بادخال أرقام المقطورة لا تتجاوز 7 أرقام")
                            }
                        } else {
                            functions.warningAlert("من فضلك قم بادخال حروف المقطورة بشكل صحيح وباللغة العربية")
                        }
                    }
                    else {
                        // else if (carType == "") {
                        functions.warningAlert("من فضلك قم باختيار تصنيف العربة")
                    }
                } else {
                    functions.warningAlert("من فضلك قم بادخال منطقة ضبط المخالفة")
                }
            } else {
                functions.warningAlert("من فضلك قم باختيار المحافظة الواقع بها المخالفة")
            }
            // } else {
            //     functions.warningAlert("من فضلك قم بادخال اسم الشركة التابع لها المخالف")
            // }
        } else {
            functions.warningAlert("من فضلك قم بادخال عدد المخالفات السابقة")
        }
        // }else{
        //     functions.warningAlert("من فضلك قم بادخال الرقم القومي بشكل صحيح مكون من 14 رقم")
        // }
    } else {
        functions.warningAlert("من فضلك قم بادخال اسم المخالف ثلاثي بشكل صحيح")
    }
    if (vaildViolator) {
        return violatorDetails;
    } else {
        return vaildViolator
    }
}
carViolation.violatorCarDetails = () => {
    let LicensesData = {}
    let unmarkedCheckbox = document.querySelector("#unmarkedCheckbox");
    let validLicenses = false
    let violatorDetails = carViolation.violatorDetails()

    let carLicenceColor = $("#carLicenseColor").val();
    let carBrand = $("#carBrand").val();
    let carLicenseTraffic = $("#carLicenseTraffic").val();
    let carLicenseLetters = $("#carLicenseLetters").val();
    let carLicenseNumbers = $("#carLicenseNumbres").val();
    let driverLicenceNumber = $("#driverLicenseNumber").val();
    let driverLicenceTraffic = $(".driverLicenseTraffic").val();
    let NationalIdRegExp = /^(2|3)[0-9][0-9][0-1][0-9][0-3][0-9](01|02|03|04|11|12|13|14|15|16|17|18|19|21|22|23|24|25|26|27|28|29|31|32|33|34|35|88)\d\d\d\d\d$/;
    if (violatorDetails != false) {
        if ((carLicenseLetters.length > 0 && carLicenseLetters.trim().length > 0) || $("#unmarkedCheckbox:checked").length != 0) {
            if ((carLicenseNumbers.length > 0 && carLicenseNumbers.length > 0) || $("#unmarkedCheckbox:checked").length != 0) {
                if (carLicenceColor != "" && isNaN(carLicenceColor)) {
                    if (carBrand != "") {
                        // if(carLicenseTraffic != ""){
                        // if(NationalIdRegExp.test(driverLicenceNumber) && driverLicenceNumber !=""){
                        // if(driverLicenceTraffic !=""){
                        LicensesData = {
                            // carLicenseLetters:carLicenseLetters,
                            carLicenseFullNumbers: carLicenseLetters + " " + carLicenseNumbers,
                            carLicenceColor: carLicenceColor,
                            carBrand: carBrand,
                            carLicenseTraffic: carLicenseTraffic != "" ? carLicenseTraffic : "",
                            driverLicenceNumber: driverLicenceNumber != "" ? driverLicenceNumber : "",
                            driverLicenceTraffic: driverLicenceTraffic != "" ? driverLicenceTraffic : ""
                        }
                        validLicenses = true;
                        // }else{
                        //     functions.warningAlert("من فضلك قم باختيار المرور الذي تم استخراج الرخصه من خلاله") 
                        // }
                        // }else{
                        //     functions.warningAlert("من فضلك قم بادخال رقم رخصة السائق بشكل صحيح مكون من 14 رقم")    
                        // }
                        // }else{
                        //     functions.warningAlert("من فضلك قم باختيار المرور المرخص من خلاله العربة")    
                        // }
                    } else {
                        functions.warningAlert("من فضلك قم باختيار نوع العربة")
                    }
                } else {
                    functions.warningAlert("من فضلك قم بادخال لون العربة المسجل بالرخصة وبشكل صحيح")
                }
            } else {
                functions.warningAlert("من فضلك قم بادخال أرقام العربة لا تتجاوز 7 أرقام")
            }
        } else {
            functions.warningAlert("من فضلك قم بادخال حروف العربة بشكل صحيح وباللغة العربية")
        }
    }

    if (validLicenses) {
        return LicensesData;
    } else {
        return validLicenses;
    }
}
carViolation.violationDetails = () => {
    let violationsData = {}
    let validViolation = false;
    // let violationType = $("#violationType").children("option:selected").val();
    let violationTypeId = $("#violationType").children("option:selected").data("id");
    let violationMaterail = $("#carViolationRawType").children("option:selected").val();
    let violationMaterailId = $("#carViolationRawType").children("option:selected").data("id");
    // let violationMaterailQuantity =$("#RawQuantity").children("option:selected").val()
    let violationDate = $("#violationDate").val();
    let violationTimeUnformatted = $("#violationTime").val();
    let violationTimeSplited = violationTimeUnformatted.split(":");
    let violationTime = violationTimeSplited[0] > 12 ? violationTimeSplited[0] - 12 + ":" + violationTimeSplited[1] + " PM"
        : violationTimeSplited[0] + ":" + violationTimeSplited[1] + " AM";
    let carType = $("#violationCarType").children("option:selected").val()
    // let selectedEquipementsIds = []
    // let selectedEquipmentsData = [];
    // let EquipmentsData = {}
    // $(".toolsBox .tool").each((index,tool)=>{ 
    //     let SelectInput = $(tool).find("input");
    //     let toolCount = $(tool).find(".toolCount")
    //     let SelectedToolId;
    //     let toolCountVal;
    //     if ($(SelectInput).is(":checked")) {
    //         SelectedToolId = $(SelectInput).data("id");
    //         toolCountVal = $(toolCount).val();
    //         EquipmentsData = {
    //             "id":SelectedToolId,
    //             "count":Number(toolCountVal),
    //         }
    //         selectedEquipementsIds.push(SelectedToolId)
    //         selectedEquipmentsData.push(EquipmentsData);
    //     }
    // })
    // console.log(selectedEquipmentsData)
    // if(violationType !=""){
    if (violationMaterail != "") {
        // if(violationMaterailQuantity !=""){
        if (carType != "" && carType == "عربة بمقطورة") {
            if (violationDate != "") {
                if (violationTimeUnformatted != "") {
                    // if(selectedEquipmentsData.length>0){
                    violationsData = {
                        violationType: violationTypeId,
                        violationMaterail: violationMaterailId,
                        // violationMaterailQuantity:violationMaterailQuantity,
                        violationDate: violationDate + " " + violationTime,
                        violationTime: violationDate + " " + violationTime,
                        // selectedEquipmentsData:selectedEquipmentsData,
                        // selectedEquipementsIds:selectedEquipementsIds,
                    }
                    validViolation = true;
                    // }else{
                    //     functions.warningAlert("من فضلك قم بتحديد المعدات التي تم ضبطها")    
                    // }
                } else {
                    functions.warningAlert("من فضلك قم بتحديد وقت حدوث المخالفة")
                }
            } else {
                functions.warningAlert("من فضلك قم بتحديد تاريخ حدوث المخالفة")
            }
        } else if (carType != "" && carType == "عربة فردي" && $(".MaterialQuantityBox").is(":visible")) {
            let violationMaterailQuantity = $("#RawQuantity").children("option:selected").val()
            if (violationMaterailQuantity != "") {
                if (violationDate != "") {
                    if (violationTimeUnformatted != "") {
                        // if(selectedEquipmentsData.length>0){
                        violationsData = {
                            violationType: violationTypeId,
                            violationMaterail: violationMaterailId,
                            violationMaterailQuantity: violationMaterailQuantity,
                            violationDate: violationDate + " " + violationTime,
                            violationTime: violationDate + " " + violationTime,
                            // selectedEquipmentsData:selectedEquipmentsData,
                            // selectedEquipementsIds:selectedEquipementsIds,
                        }
                        validViolation = true;
                        // }else{
                        //     functions.warningAlert("من فضلك قم بتحديد المعدات التي تم ضبطها")    
                        // }
                    } else {
                        functions.warningAlert("من فضلك قم بتحديد وقت حدوث المخالفة")
                    }
                } else {
                    functions.warningAlert("من فضلك قم بتحديد تاريخ حدوث المخالفة")
                }
            } else {
                functions.warningAlert("من فضلك قم بتحديد كمية الخام المضبوط بالمخالفة")
            }
        } else {
            functions.warningAlert("من فضلك قم باختيار نوع العربة")
        }
        // }else{
        //     functions.warningAlert("من فضلك قم بتحديد كمية الخام المضبوط بالمخالفة")    
        // }
    } else {
        functions.warningAlert("من فضلك قم باختيار نوع الخام المضبوط في المخالفة")
    }
    // }else{
    //     functions.warningAlert("من فضلك قم باختيار نوع المخالفة")
    // }
    if (validViolation) {
        return violationsData;
    } else {
        return validViolation
    }
}
carViolation.violationDimensionsCoordsDetails = () => {
    let DimensionsOtherDetails = {}
    let validDimensionsOthers = false;
    let coordsResponse = carViolation.GetCoordinates()
    let coordinates = carViolation.GetCoordinates().Decimal;
    let coordinatesDegrees = carViolation.GetCoordinates().Degree;
    let attachecdFiles = $(".attachViolationFiles")[0].files
    let attachecdReportFiles = $(".attachViolationReportFile")[0].files
    // let violationDescription = $("#violationDescription").val();
    // let violationLeaderOpinion = $("#sectorManegrOpinionCar").val();
    // let committeeMember = sharedApis.checkCommitteeMember()
    // let selectedMembersIds = [];
    // let membersNames = $(".committeeMember").find(".membersDataBox").find(".memberData").children(".committeePersonName")
    // let committeeMemberId;
    // let violationMembersArr = [];
    // membersNames.each((index, memberName) => {
    //     committeeMemberId = Number($(memberName).data("id"))
    //     selectedMembersIds.push(committeeMemberId)
    // })
    // let sectorId = $(".recorder").find(".committeeData").children(".committeePersonName").data("sectorid");

    if (coordsResponse != false) {
        if (attachecdFiles != null && attachecdFiles.length > 0) {
            if (attachecdReportFiles != null && attachecdReportFiles.length > 0) {
                // if (violationDescription != "") {
                // if (violationLeaderOpinion != "") {
                // if(committeeMember != false){
                DimensionsOtherDetails = {
                    coordinates: coordinates,
                    coordinatesDegrees: coordinatesDegrees,
                    // violationDescription: violationDescription,
                    // violationLeaderOpinion: violationLeaderOpinion,
                    // committeeMembersId: selectedMembersIds.length > 0 ? selectedMembersIds : [],
                    // sectorId: sectorId,
                }
                validDimensionsOthers = true;
                // }else{
                //     functions.warningAlert("من فضلك قم باختيار اسم عضو اللجنة")    
                // }
                // } else {
                //     functions.warningAlert("من فضلك قم بادخال رأي السيد قائد القطاع")
                // }
                // } else {
                //     functions.warningAlert("من فضلك قم بادخال الوصف الخاص بالمخالفة")
                // }
            } else {
                functions.warningAlert("من فضلك قم بإرفاق التقرير المصور")
            }
        } else {
            functions.warningAlert("من فضلك قم بإرفاق أصل محضر الضبط")
        }
    } else {
        functions.warningAlert("من فضلك قم بإدخال جميع الاحداثيات وبشكل صحيح")
    }

    if (validDimensionsOthers) {
        return DimensionsOtherDetails;
    } else {
        return validDimensionsOthers;
    }
}
carViolation.otherViolationDetails = () => {
    let otherViolationDetails = {};
    let validOtherDetails = false;
    let violationDescription = $("#violationDescription").val();
    let violationLeaderOpinion = $("#sectorManegrOpinion").val();
    let member = $("#committeeMemberText").val();
    /////////////////////////////////////////////////
    // let committeeMember = sharedApis.checkCommitteeMember()
    // let selectedMembersIds = [];
    // let membersNames = $(".committeeMember").find(".membersDataBox").find(".memberData").children(".committeePersonName")
    // let committeeMemberId;
    // membersNames.each((index, memberName) => {
    //     committeeMemberId = Number($(memberName).data("id"))
    //     selectedMembersIds.push(committeeMemberId)
    //     console.log("member ID", committeeMemberId)
    //     console.log("all members IDs", selectedMembersIds)
    // })
    //////////////////////////////////////////////////////////
    /////////////////////////////////////////////////
    let committeeMember = sharedApis.checkCommitteeMember()
    let selectedMembersIds = [];
    let membersNamesText = "";

    let members = $(".committeeMember").find(".membersDataBox").find(".memberData")
    let committeeMemberId;
    members.each((index, memberName) => {
        committeeMemberId = Number($(memberName).data("id"))
        selectedMembersIds.push(committeeMemberId)
        membersNamesText += $(memberName).find(".committeePersonRank").text() + " " + $(memberName).find(".committeePersonName").text() + " " + $(memberName).find(".committeePersonJop").text() + "\n"
    })
    //////////////////////////////////////////////////////////
    // let sectorId = $(".recorder").find(".committeeData").children(".committeePersonName").data("sectorid");
    // let attachecdFiles = $("#attachViolationFiles")[0].files
    // let attachecdReportFiles = $("#attachViolationReportFile")[0].files

    if (violationDescription != "") {
        if (membersNamesText != "") {
            // if(committeeMember != false){
            if (violationLeaderOpinion != "") {
                if (selectedMembersIds.length > 0) {

                    otherViolationDetails = {
                        violationDescription: violationDescription,
                        violationLeaderOpinion: violationLeaderOpinion,
                        committeeMembersId: selectedMembersIds.length > 0 ? selectedMembersIds : [],
                        member: member,
                        membersNamesText: membersNamesText,
                        // sectorId:sectorId,
                    }
                    validOtherDetails = true;
                } else {
                    functions.warningAlert("من فضلك ادخل علي الأقل عضو واحد من اعضاء اللجنة", "#sectorManegrOpinion")
                }
            } else {

                functions.warningAlert("من فضلك قم بادخال رأي السيد قائد القطاع", "#sectorManegrOpinion")
            }

            // }else{
            //     functions.warningAlert("من فضلك قم باختيار اسم عضو اللجنة")    
            // }
        } else {
            functions.warningAlert("من فضلك قم بادخال القائمون بالضبط ", "#committeeMember")

        }
    } else {
        functions.warningAlert("من فضلك قم بادخال الوصف الخاص بالمخالفة", "#violationDescription")
    }

    if (validOtherDetails) {
        return otherViolationDetails;
    } else {
        return validOtherDetails
    }
}
carViolation.formActions = () => {

    let unmarkedCheckbox = document.querySelector("#unmarkedCheckbox");
    let carLicenseLetters = document.querySelector("#carLicenseLetters");
    let carLicenseNumbres = document.querySelector("#carLicenseNumbres");

    unmarkedCheckbox.addEventListener('change', (event) => {
        if (event.currentTarget.checked) {
            $("#carLicenseLetters").prop('disabled', true);
            $("#carLicenseNumbres").prop('disabled', true);
            $("#carLicenseLetters").val("")
            $("#carLicenseNumbres").val("")
            $("#tractorLetters").prop('disabled', true);
            $("#tractorNumbers").prop('disabled', true);
            $("#tractorLetters").val("")
            $("#tractorNumbers").val("")
            // carLicenseLetters.value = ""
            // carLicenseNumbres.value = ""
        } else {
            $("#carLicenseLetters").removeAttr('disabled');
            $("#carLicenseNumbres").removeAttr('disabled');
            $("#tractorNumbers").removeAttr('disabled');
            $("#tractorLetters").removeAttr('disabled');
            // carLicenseLetters.setAttribute("disabled", false)
            // carLicenseNumbres.setAttribute("disabled", false)
        }
    })

    let numberOfDaysBefore = functions.getViolationStartDate(3)
    functions.inputDateFormat(".inputDate", numberOfDaysBefore, "today", 'dd/mm/yyyy')

    $(".violatorNationalId").on("keypress", (e) => {
        return functions.isNumberKey(e)
    })
    $(".prevViolationsCount").on("keypress", (e) => {
        return functions.isNumberKey(e)
    })
    $(".tractorNumbers").on("keypress", (e) => {
        return functions.isNumberKey(e)
    })
    $(".carLicenseNumbres").on("keypress", (e) => {
        return functions.isNumberKey(e)
    })
    $(".driverLicenseNumber").on("keypress", (e) => {
        return functions.isNumberKey(e)
    })

    // $(".coordinatesTable").children("table").find("input").on("keypress",(e)=>{
    //     return functions.isNumberKey(e)
    // })

    $(".coordinatesTable").children("table").find("td").children("input:nth-child(1)").on("keypress", (e) => {
        return functions.isNumberKey(e)
    })
    $(".coordinatesTable").children("table").find("td").children("input:nth-child(2)").on("keypress", (e) => {
        return functions.isNumberKey(e)
    })
    $(".coordinatesTable").children("table").find("td").children("input:nth-child(3)").on("keypress", (e) => {
        return functions.isDecimalNumberKey(e)
    })

    $("#violationCarType").on("change", (e) => {
        if ($(e.currentTarget).val() == "عربة بمقطورة") {
            $(".tractorBox").show()
            $(".MaterialQuantityBox").hide()
        } else {
            $(".tractorBox").hide()
            $(".MaterialQuantityBox").show()
        }
    })


    // $("#committeeMemberSelect").on('change', function () {
    //     DimensionsAndOtherDetails.violationMembersArr = $(this).val();
    //     console.log(DimensionsAndOtherDetails.violationMembersArr);
    // })
    // $("#committeeMemberSelect").on("change",(e)=>{
    //     $(".committeeMember").find(".committeeData").children(".committeePersonName,.committeePersonRank,.committeePersonJop").remove()
    //     let memberData = sharedApis.checkCommitteeMember()
    //     if(memberData != false){
    //         $(e.currentTarget).parents(".committeeSearch").siblings(".committeeData").children(".reSelectMember").before(`
    //             <h5 class="committeePersonName" data-id="${memberData.CommitteeMemberId}">${memberData.CommitteeMemberName}</h5>
    //             <p class="committeePersonRank">${memberData.CommitteeMemberRank}</p>
    //             <p class="committeePersonJop">${memberData.CommitteeMemberJopTitle}</p>
    //         `)
    //         $(e.currentTarget).parents(".committeeSearch").hide(200)
    //         $(e.currentTarget).parents(".committeeSearch").siblings(".committeeData").show(200)
    //     }
    // })

    ////////////////////////////////////////////////////////////////////////////////////////////////
    $(".submitSelectedMembersBtn").on("click", (e) => {
        $(".committeeMember").find(".committeeData").children(".membersDataBox").empty()
        let membersData = sharedApis.checkCommitteeMember()
        if (membersData.length > 0) {
            membersData.forEach(memberData => {
                $(e.currentTarget).parents(".committeeSearch").siblings(".committeeData").children(".membersDataBox").append(`
                <div class="memberData">
                    <p class="committeePersonRank">${memberData.CommitteeMemberRank}/ </p>
                    <h5 class="committeePersonName" data-id="${memberData.CommitteeMemberId}">${memberData.CommitteeMemberName}</h5>
                    </div>`)
            })
            // <p class="committeePersonJop">(${memberData.CommitteeMemberJopTitle})</p>
            $(e.currentTarget).parents(".committeeSearch").hide(200)
            $(e.currentTarget).parents(".committeeSearch").siblings(".committeeData").show(200)
        } else {
            functions.warningAlert("لم يتم إضافة أي عضو لجنة, من فضلك قم بالاضافة أولا لعرض بيانات الأعضاء")
        }
    })

    $(".reSelectMember").on("click", (e) => {
        $(e.currentTarget).parents(".committeeData").hide(200)
        $(e.currentTarget).parents(".committeeData").siblings(".committeeSearch").show(200)
        $(e.currentTarget).parents(".committeeData").siblings(".committeeSearch").find("select").find("option").removeAttr("selected");
        $(e.currentTarget).parents(".committeeData").siblings(".committeeSearch").find("select").find("option:first-child").prop("selected", true);
    })
    ////////////////////////////////////////////////////////////////////////////////////////////////


    // $(".showOnMap").on("click", (e) => {
    //     let Coords = carViolation.GetCoordinates().Decimal
    //     if (Coords != undefined) {
    //         carViolation.drawCoordinates(Coords)
    //         $(".ShowOnMapBox").toggle()
    //         $(e.currentTarget).text($(e.currentTarget).text() == "عرض على الخريطة" ? "إخفاء الخريطة" : "عرض على الخريطة")
    //     } else {
    //         functions.warningAlert("لا يمكن عرض الخريطة قبل إدخال الإحداثيات, من فضلك أدخل الإحداثيات أولا")
    //     }
    // })

    $("#carLicenseLetters").on("keypress", (e) => {
        if (e.currentTarget.value.length > 0) {
            let charCode = e.currentTarget.value.charCodeAt(e.currentTarget.value.length - 1)
            if (charCode >= 1569 && charCode <= 1610) {
                e.currentTarget.value += " ";
            }
        }
        return functions.isArabicLetter(e)
    })
    $("#tractorLetters").on("keypress", (e) => {
        if (e.currentTarget.value.length > 0) {
            let charCode = e.currentTarget.value.charCodeAt(e.currentTarget.value.length - 1)
            if (charCode >= 1569 && charCode <= 1610) {
                e.currentTarget.value += " ";
            }
        }
        return functions.isArabicLetter(e)
    })

    $("#submitCarViolation").on("click", (e) => {
        carViolation.validateForm(e)
    })

    $("#cancelCarViolation").on("click", (e) => {
        window.location.href = "/ViolationsRecorder/Pages/RegisteredViolationsRecords.aspx"
    })

    $(".dropFilesArea").hide()
    let violationFiles;
    let countOfFiles;
    let filesExtension = ["gif", "svg", "jpg", "jpeg", "png", "doc", "docx", "pdf", "xls", "xlsx", "pptx"]
    $(".attachViolationFiles").on("change", (e) => {
        violationFiles = $(e.currentTarget)[0].files
        if (violationFiles.length > 0) {
            $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").show().empty()
        }

        for (let i = 0; i < violationFiles.length; i++) {
            $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").append(`
                <div class="file">
                    <p class="fileName">${violationFiles[i].name}</p>
                    <span class="deleteFile" data-index="${i}"><i class="fa-sharp fa-solid fa-x"></i></span>
                </div>
            `);
        }
        $(".deleteFile").on("click", (event) => {
            $(e.currentTarget).val()
            let index = $(event.currentTarget).closest(".file").index()
            $(event.currentTarget).closest(".file").remove()
            let fileBuffer = new DataTransfer()
            for (let i = 0; i < violationFiles.length; i++) {
                if (index !== i) {
                    fileBuffer.items.add(violationFiles[i]);
                }
            }
            violationFiles = fileBuffer.files
            countOfFiles = violationFiles.length
            // console.log(violationFiles)

            if (countOfFiles == 0) {
                // $(e.currentTarget).closest(".dropFilesArea").hide()
                $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide()
            }
        })
        for (let i = 0; i < violationFiles.length; i++) {
            let fileSplited = violationFiles[i].name.split(".")
            let fileExt = fileSplited[fileSplited.length - 1].toLowerCase()
            if ($.inArray(fileExt, filesExtension) == -1) {
                functions.warningAlert("من فضلك أدخل الملفات بالامتدادات المسموح بها فقط")
                $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide()
                // violationFiles = fileBuffer
                $(e.currentTarget).val("")
            }
        }
    })

    let violationReportFiles;
    let countOfReportFiles;
    $(".attachViolationReportFile").on("change", (e) => {
        violationReportFiles = $(e.currentTarget)[0].files
        if (violationReportFiles.length > 0) {
            $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").show().empty()
        }

        for (let i = 0; i < violationReportFiles.length; i++) {
            $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").append(`
                <div class="file">
                    <p class="fileName">${violationReportFiles[i].name}</p>
                    <span class="deleteFile" data-index="${i}"><i class="fa-sharp fa-solid fa-x"></i></span>
                </div>
            `);
        }
        $(".deleteFile").on("click", (event) => {
            $(event.currentTarget).val('')
            let index = $(event.currentTarget).closest(".file").index()
            $(event.currentTarget).closest(".file").remove()
            let fileBuffer = new DataTransfer()
            for (let i = 0; i < violationReportFiles.length; i++) {
                if (index !== i) {
                    fileBuffer.items.add(violationReportFiles[i]);
                }
            }
            violationReportFiles = fileBuffer.files
            countOfReportFiles = violationReportFiles.length
            // console.log(violationFiles)

            if (countOfReportFiles == 0) {
                // $(e.currentTarget).closest(".dropFilesArea").hide()
                $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide()
            }
        })
        for (let i = 0; i < violationReportFiles.length; i++) {
            let fileSplited = violationReportFiles[i].name.split(".")
            let fileExt = fileSplited[fileSplited.length - 1].toLowerCase()
            if ($.inArray(fileExt, filesExtension) == -1) {
                functions.warningAlert("من فضلك أدخل الملفات بالامتدادات المسموح بها فقط")
                $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide()
                $(e.currentTarget).val("")
            }
        }
    })

    let tableRows = $("#coordinatesTable tr:not(:first-child)")
    tableRows.each((index, row) => {
        let currentRow = $(row)
        $(currentRow).find("td:nth-child(2)").find("input:nth-child(1)").on("keyup", (e) => {
            if (Number($(e.currentTarget).val()) == 37) {
                $(e.currentTarget).closest("td").find("input:nth-child(2)").val(0)
                $(e.currentTarget).closest("td").find("input:nth-child(2)").attr("disabled", "disabled")
                $(e.currentTarget).closest("td").find("input:nth-child(3)").val(0)
                $(e.currentTarget).closest("td").find("input:nth-child(3)").attr("disabled", "disabled")
            } else if ($(e.currentTarget).val() == "" || Number($(e.currentTarget).val()) != 37) {
                $(e.currentTarget).closest("td").find("input:nth-child(2)").val("")
                $(e.currentTarget).closest("td").find("input:nth-child(2)").removeAttr("disabled")
                $(e.currentTarget).closest("td").find("input:nth-child(3)").val("")
                $(e.currentTarget).closest("td").find("input:nth-child(3)").removeAttr("disabled")
            }
        })
        $(currentRow).find("td:nth-child(3)").find("input:nth-child(1)").on("keyup", (e) => {
            if (Number($(e.currentTarget).val()) == 32) {
                $(e.currentTarget).closest("td").find("input:nth-child(2)").val(0)
                $(e.currentTarget).closest("td").find("input:nth-child(2)").attr("disabled", "disabled")
                $(e.currentTarget).closest("td").find("input:nth-child(3)").val(0)
                $(e.currentTarget).closest("td").find("input:nth-child(3)").attr("disabled", "disabled")
            } else if ($(e.currentTarget).val() == "" || Number($(e.currentTarget).val()) != 32) {
                $(e.currentTarget).closest("td").find("input:nth-child(2)").val("")
                $(e.currentTarget).closest("td").find("input:nth-child(2)").removeAttr("disabled")
                $(e.currentTarget).closest("td").find("input:nth-child(3)").val("")
                $(e.currentTarget).closest("td").find("input:nth-child(3)").removeAttr("disabled")
            }
        })
    });

    sharedApis.getGovernrates("#violationGov")
    // sharedApis.getViolationZones("#violationArea")
    sharedApis.getCarType("#violationCarType")
    sharedApis.getTrafficName("#carLicenseTraffic")
    sharedApis.getTrafficName("#driverLicenseTraffic")
    sharedApis.getViolationType("#violationType")
    sharedApis.getViolationMaterails("#carViolationRawType")
    sharedApis.getMaterialAmmount("#RawQuantity")
    sharedApis.getEquipments(".carToolsBox")
    sharedApis.getCommitteeRecorder(".committeeBox.recorder", ".committeeBox.sectorManager")
    // sharedApis.getCommitteeMember(".committeeMember")

    carViolation.getCommitteeMember()
    $(".PreLoader").removeClass("active");
}
carViolation.getCommitteeMember = () => {
    return new Promise(function (resolve, reject) {
        $.ajax({
            type: "GET",
            url: _spPageContextInfo.siteAbsoluteUrl + "/_api/web/lists/getbytitle('Configurations')/items?$OrderBy=Title asc&$top=1000",
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: (data) => {
                if (data != null) {
                    resolve(data);
                    let UsersData = data.value;
                    UsersData.forEach(User => {
                        if (User.Type == "CommiteeMember") {
                            $(".committeeMember").find(".selectBox").children("select").append(`
                                <option value="${User.ID}" data-memberrank="${User.Rank}" data-jobtitle="${User.JobTitle1}"><span>${User.Rank}/</span> ${User.Title}</option>
                            `)
                        }
                    })
                } else {
                    resolve([]);
                }
            },
            error: (xhr) => {
                console.log(xhr.responseText);
            },
        });
    });
}
carViolation.validateForm = (e) => {
    let UserId = _spPageContextInfo.userId;
    let carViolationData = {}
    let violatorCarDetails = carViolation.violatorCarDetails()
    let dimensionsOtherDetails = carViolation.violationDimensionsCoordsDetails()
    let otherViolationDetails = carViolation.otherViolationDetails()
    let violationDetails = carViolation.violationDetails()
    let violatorDetails = carViolation.violatorDetails()
    let SectorMembers = $(".membersText").val();
    let violationDateArr = violationDetails.violationDate.split('/')
    let violationDate = `${violationDateArr[1]}-${violationDateArr[0]}-${violationDateArr[2]}`
    let violationTimeArr = violationDetails.violationTime.split('/')
    let violationTime = `${violationTimeArr[1]}-${violationTimeArr[0]}-${violationTimeArr[2]}`

    // if(violatorDetails != false){
    if (SectorMembers != "") {

        if (violatorCarDetails != false) {
            if (violationDetails != false) {
                if (dimensionsOtherDetails != false) {
                    if (otherViolationDetails != false) {
                        // otherViolationDetails.membersNamesText += '\n' + "otherViolationDetails.member"
                        functions.disableButton(e)
                        carViolationData = {
                            // Edit violation 
                            ID: urlParams.get("taskId") !== null ? editViolationId : "",
                            IsEdit: urlParams.get("taskId") !== null ? true : false,

                            // End edit violation
                            Title: "New Car Violation",
                            OffenderType: "Vehicle",
                            ViolatorName: violatorDetails.violatorName,
                            NationalID: violatorDetails.violatorNationalId,
                            NumOfPreviousViolations: violatorDetails.violationPrevCount,
                            ViolatorCompany: violatorDetails.companyName,
                            CommercialRegister: violatorDetails.commercialRegister,
                            Governrate: violatorDetails.violationGov,
                            ViolationsZone: violatorDetails.violationAreaName,
                            VehicleType: violatorDetails.carType,
                            TrailerNum: violatorDetails.carType == "عربة بمقطورة" ? violatorDetails.TractorNumber : "",

                            CarNumber: violatorCarDetails.carLicenseFullNumbers,
                            CarColor: violatorCarDetails.carLicenceColor,
                            VehicleBrand: violatorCarDetails.carBrand,
                            TrafficName: violatorCarDetails.carLicenseTraffic != "" ? violatorCarDetails.carLicenseTraffic : "",
                            DrivingLicense: violatorCarDetails.driverLicenceNumber != "" ? violatorCarDetails.driverLicenceNumber : "",
                            TrafficLicense: violatorCarDetails.driverLicenceTraffic != "" ? violatorCarDetails.driverLicenceTraffic : "",
                            // carLicenseLetters: violatorCarDetails.carLicenseLetters != "" ? violatorCarDetails.carLicenseLetters : "" ,
                            // ViolationType:violationDetails.violationType,
                            MaterialType: violationDetails.violationMaterail,
                            MaterialAmount: violationDetails.violationMaterailQuantity,
                            ViolationDate: violationDate,
                            ViolationTime: violationTime,
                            // Equipments:violationDetails.selectedEquipementsIds,
                            // EquipmentsCount:violationDetails.selectedEquipmentsData,

                            Coordinates: dimensionsOtherDetails.coordinates,
                            CoordinatesDegrees: dimensionsOtherDetails.coordinatesDegrees,
                            // Description: dimensionsOtherDetails.violationDescription,
                            // LeaderOpinion: dimensionsOtherDetails.violationLeaderOpinion,
                            // CommiteeMember: dimensionsOtherDetails.violationMembersArr,

                            Description: otherViolationDetails?.violationDescription,
                            LeaderOpinion: otherViolationDetails?.violationLeaderOpinion,
                            // CommiteeMember: otherViolationDetails?.member,
                            // CommiteeMember: otherViolationDetails?.committeeMembersId?.length > 0 ? otherViolationDetails.committeeMembersId : [],
                            CommiteeMember: otherViolationDetails.membersNamesText != "" ? otherViolationDetails.membersNamesText : "-",
                            SectorMembers: SectorMembers,
                            Sector: UserId,
                        }
                        carViolation.submitNewViolation(carViolationData)
                    }

                }
            }
        }
    } else {
        functions.warningAlert("من فضلك قم بادخال اعضاء اللجنة")
    }
    // }
    carViolation.violatorCarDetails()
}
carViolation.submitNewViolation = (carViolationData) => {
    $(".overlay").addClass("active")
    let request = {
        Data: carViolationData
    }
    functions.requester("/_layouts/15/Uranium.Violations.SharePoint/Violations.aspx/Save", { request })
        .then(response => {
            if (response.ok) {
                return response.json()
            }
        })
        .then(data => {
            $(".overlay").addClass("active")
            if (data.d.Status) {
                let carViolationId = data.d.Result.Id
                carViolation.uploadAttachment(carViolationId, "Violations")
            } else {
                $(".overlay").removeClass("active")
                functions.warningAlert("حدث خطأ ما, لم بتم إضافة المخالفة")
            }
        })
        .catch((err) => {
            console.log(err)
        })
}
carViolation.GetCoordinates = () => {
    var Rows = $("#coordinatesTable tr:not(:first-child)");
    let PointsArr = "[";
    let DecimalsArr = "[";
    let NumbersArr = "[";
    let IsValid = true;
    let pattern = new RegExp(/^\d*\.?\d*$/);
    Rows.each((index, Row) => {
        let CurrentRow = $(Row);
        let Cells = CurrentRow.find("td");
        let EastTds = CurrentRow.find("td:nth-child(2)")
        let NorthTds = CurrentRow.find("td:nth-child(3)")
        let PointArr = [];
        let DecimalArr = [];
        let NumberArr = []
        Cells.each((cellIndex, Cell) => {
            let CurrentCell = $(Cell);
            let firstTd = $(Cell)[0]
            let lastTd = $(Cell)[1]
            let firstEastInputVal = Number(EastTds.find("input:nth-child(1)").val())
            let secondEastInputVal = Number(EastTds.find("input:nth-child(2)").val())
            let thirdEastInputVal = Number(EastTds.find("input:nth-child(3)").val())
            let firstNorthInputVal = Number(NorthTds.find("input:nth-child(1)").val())
            let secondNorthInputVal = Number(NorthTds.find("input:nth-child(2)").val())
            let thirdNorthInputVal = Number(NorthTds.find("input:nth-child(3)").val())
            let Fields = CurrentCell.find("input");
            let Temp = [];
            if (CurrentCell.index() != 3) {
                Fields.each((index, Field) => {
                    let CurrentField = $(Field);
                    let Value = CurrentField.val().trim();
                    if (Value != "" && pattern.test(Value) && 37 >= firstEastInputVal && firstEastInputVal >= 24 && 32 >= firstNorthInputVal && firstNorthInputVal >= 22 && 60 > secondEastInputVal && 60 > thirdEastInputVal && 60 > secondNorthInputVal && 60 > thirdNorthInputVal) {
                        Temp.push(Value);
                    } else {
                        IsValid = false;
                        return false;
                    }
                });
                PointArr.push(Temp[0] + "° " + Temp[1] + "' " + Temp[2] + '"');
                NumberArr.push(Temp[0] + " " + Temp[1] + " " + Temp[2] + " ")
                DecimalArr.push(
                    parseFloat(Temp[0]) +
                    parseFloat(Temp[1]) / 60 +
                    parseFloat(Temp[2]) / 3600
                );
            }
        });
        if (index == Rows.length - 1) {
            PointsArr += "[" + PointArr + "]";
            NumbersArr += "[" + NumberArr + "]";
            DecimalsArr += "[" + DecimalArr + "]";
        } else {
            PointsArr += "[" + PointArr + "],";
            NumbersArr += "[" + NumberArr + "],";
            DecimalsArr += "[" + DecimalArr + "],";
        }
    });
    PointsArr += "]";
    NumbersArr += "]"
    DecimalsArr += "]";
    if (IsValid) {
        return {
            Degree: PointsArr,
            Decimal: DecimalsArr,
            Numbers: NumbersArr
        };
    } else {
        // functions.warningAlert("من فضلك قم بإدخال جميع الاحداثيات وبشكل صحيح")
        return false;
    }
}
carViolation.uploadAttachment = (NewCarViolationID, ListName) => {
    let Data = new FormData();
    Data.append("itemId", NewCarViolationID);
    Data.append("listName", ListName);
    Data.append("Method", urlParams.get("taskId") !== null ? "Edit" : "",)
    let count = 0
    let i;

    // let files = document.querySelectorAll("input[type='file']")[0].files;
    // console.log(files)
    // for (let file of files) {
    //     Data.append("file", file);
    // }

    // let filesInputs = document.querySelectorAll(".attachFilesInput");
    // filesInputs.forEach(input=>{
    //     input.addEventListener("change",(e)=>{
    //         let files = input.currentTarget.files
    //         for (const file of files) {
    //             // formData.append("file", file);
    //             Data.append("file", file);
    //         }
    //     })
    // })

    for (i = 0; i < $('#attachViolationFiles')[0].files.length; i++) {
        Data.append("file" + i, $('#attachViolationFiles')[0].files[i]);
    }
    for (let j = i; count < $('#attachViolationReportFile')[0].files.length; j++) {
        Data.append("file" + j, $('#attachViolationReportFile')[0].files[count]);
        count++;
    }
    $.ajax({
        type: "POST",
        url: "/_layouts/15/Uranium.Violations.SharePoint/Attachments.aspx/Upload",
        processData: false,
        contentType: false,
        data: Data,
        success: (data) => {
            $(".overlay").removeClass("active")

            functions.sucessAlert(urlParams.get("taskId") ? "تم تعديل مخالفة عربة بنجاح" : "تم إضافة مخالفة عربة جديدة بنجاح", false, "/ViolationsRecorder/Pages/RegisteredViolationsRecords.aspx")
        },
        error: (err) => {
            functions.warningAlert("خطأ في إرسال البيانات لقاعدة البيانات")
            $(".overlay").removeClass("active")
            console.log(err.responseText);
        }
    });
}
carViolation.drawCoordinates = (Coords) => {
    let pointLat;
    let pointLng;
    let marker;
    let pointWithoutStartBraces = Coords.replace("[[", '')
    let filteredFirstPoint = pointWithoutStartBraces.replace("]]", '').trim().split(",")
    pointLat = filteredFirstPoint[0]
    pointLng = filteredFirstPoint[1]
    marker = `marker=${pointLat};${pointLng}`
    $(".ShowOnMapBox").find("#coordinatesMap").empty()
    $(".ShowOnMapBox").find("#coordinatesMap").append(`
        <div class="embed-container">
            <iframe width="500" height="400" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" title="World Bank Map" src="//www.arcgis.com/apps/Embed/index.html?webmap=051417efba8a4a14ac04ef195beb3b05&extent=26.6843,26.2561,33.4299,29.5516&zoom=true&previewImage=false&scale=true&disable_scroll=true&theme=light&${marker}"></iframe>
        </div>
    `)
    // let dojoConfig = {
    //     // ... your stuff
    //     packages: [
    //       {'jquery': 'https://code.jquery.com/jquery-3.6.1.min.js'}
    //     ]
    // }
    // if($("#coordinatesMap").length > 0){
    //     require([
    //         "esri/Map",
    //         "esri/views/MapView",
    //         // "esri/Graphic",
    //         // "esri/Basemap",
    //         // "esri/layers/FeatureLayer",
    //         // "esri/layers/support/LabelClass",
    //         // "esri/core/watchUtils",
    //         // "esri/widgets/Home",
    //     ],(Map,MapView)=>{
    //         // let myMap = new Map({
    //         //     // basemap: "topo-vector",
    //         //     // basemap : new Basemap({
    //         //     //     portalItem: {
    //         //     //         id: "6eb69353f886481d9f148a9a6281961a", // the id for the base map with out labels
    //         //     //         portal: "https://www.arcgis.com"
    //         //     //     }
    //         //     // })
    //         // })

    //         // let view = new MapView({
    //         //     container: "coordinatesMap",
    //         //     map: myMap,
    //         //     zoom: 6,
    //         //     center: [30.82763671874111, 26.657277674210142],
    //         //     cursor: "pointer",
    //         // });
    //     })
    // }
}
carViolation.editViolation = () => {
    if (urlParams.get("taskId") !== null) {
        $(".PreLoader").addClass("active");
        functions
            .requester(
                "/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/FindbyId",
                {
                    Id: urlParams.get("taskId"),
                }
            )
            .then((response) => {
                if (response.ok) {
                    return response.json();
                }
            })
            .then((data) => {
                let violationDataParentObj = data.d;
                let violationData = data.d.Violation;
                editViolationId = data.d.ViolationId
                functions.commonEditData(violationData, data.d.ViolationId, 1, violationDataParentObj);
                $("#BonesCount")
                    .val(violationData.BonsNumber)
                    .trigger("change");
                $("#quarryType").val(violationData.QuarryType).trigger("change");
                $("#quarryCode").val(violationData.QuarryCode);
                violationData.Equipments.forEach((equipment, index) => {
                    let selectedInput = $(`label[for="${equipment.Name}"]`);
                    selectedInput.trigger("click");
                    selectedInput
                        .siblings("#toolCount")
                        .val(violationData.Equipments_Count[index].count);
                });
                $("#violationDepth").val(violationData.Depth);
                $("#AreaSpace").val(violationData.Area);
                $(".totalAreaSpace").val(
                    ($("#violationDepth").val() * $("#AreaSpace").val()).toFixed(3)
                );
                $("#distanceToNearQuarry").val(violationData.DistanceToNearestQuarry);
                $("#NearestQuarryNumber").val(violationData.NearestQuarryCode);
                $("#s4-workspace").scrollTop(0, 0);
                $(".PreLoader").removeClass("active");
            });
    }
};
export default carViolation; 
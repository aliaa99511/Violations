import functions from "./functions";

let sharedApis = {};

sharedApis.getGovernrates = (Selector) => {
  let UserId = _spPageContextInfo.userId;
  functions.callSharePointListApi("Configurations").then((Users) => {
    let UsersData = Users.value;
    UsersData.forEach((User) => {
      if (User.UserIdId.find((id) => id == UserId)) {
        let UserConfigId = User.ID;
        functions.callSharePointListApi("Governrates").then((Govs) => {
          let GovsData = Govs.value;

          GovsData.forEach((Gov) => {
            $(Selector).append(`
                            <option value="${Gov.Code}" data-id="${Gov.ID}">${Gov.Title}</option>
                        `);
            // if (User.JobTitle1 == "الشركة المصرية للتعدين") {
            //     $(Selector).append(`
            //         <option value="${Gov.Code}" data-id="${Gov.ID}">${Gov.Title}</option>
            //     `)
            //     return;
            // }
            // if (Gov.SectorConfigIdId == UserConfigId) {
            //     $(Selector).append(`
            //         <option value="${Gov.Code}" data-id="${Gov.ID}">${Gov.Title}</option>
            //     `)
            // }
          });
        });
      }
    });
  });
};

// sharedApis.getViolationZones = (Selector) => {
//     functions.callSharePointListApi("ViolationZones").then(Zones=>{
//         let unsortedZonesData = Zones.value
//         let sortedZonesData = unsortedZonesData.sort((a,b)=>{
//             if(a.Title < b.Title){
//                 return -1
//             }
//             if(a.Title > b.Title){
//                 return 1
//             }
//             return 0;
//         })
//         sortedZonesData.forEach(Zone => {
//             $(Selector).append(`
//                 <option value="${Zone.Title}" data-areaname="${Zone.Title}" data-id="${Zone.ID}" data-govcode="${Zone.ZoneCode}" data-sectorcode="${Zone.SectorCode}">${Zone.Title}</option>
//             `)
//         });
//     })
// }

sharedApis.getViolationSectors = (Selector) => {
  functions.callSharePointListApi("Sectors").then((SectorsData) => {
    let Sectors = SectorsData.value;
    Sectors.forEach((Sector) => {
      $(Selector).append(`
                <option value="${Sector.SectorConfigIdId}" data-code="${Sector.Code}">${Sector.Title}</option>
            `);
    });
  });
};
sharedApis.getViolationType = (Selector) => {
  functions.callSharePointListApi("ViolationsTypes").then((Types) => {
    let unsortedViolationsTypes = Types.value;
    let sortedViolationsType = unsortedViolationsTypes.sort((a, b) => {
      if (a.Title < b.Title) {
        return -1;
      }
      if (a.Title > b.Title) {
        return 1;
      }
      return 0;
    });
    sortedViolationsType.forEach((Type) => {
      $(Selector).append(`
                <option value="${Type.Title}" data-id="${Type.ID}" data-category="${Type.OffenderType}">${Type.Title}</option>
            `);
    });
    // ViolationsTypes.forEach(Type => {
    // });
  });
};
sharedApis.getProsecutions = (Selector) => {
  let Request = {
    ColumnName: "AssignedProsecution",
  };

  return new Promise((resolve, reject) => {
    functions
      .requester(
        "/_layouts/15/Uranium.Violations.SharePoint/Violations.aspx/GetChoices",
        { Request }
      )
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Network response was not ok');
      })
      .then((data) => {
        let Prosecutions = data.d.Result;
        const $ddl = $(Selector);

        $ddl.empty().append(`
          <option value="" disabled selected hidden>
            النيابة المختصة
          </option>
        `);

        Prosecutions.forEach((prosecution) => {
          $ddl.append(`
            <option value="${prosecution}">${prosecution}</option>
          `);
        });

        resolve(Prosecutions);
      })
      .catch((error) => {
        console.error("Error loading prosecutions:", error);
        reject(error);
      });
  });
};
sharedApis.getViolationMaterails = (Selector) => {
  functions.callSharePointListApi("Materials").then((Materails) => {
    let unsortedViolationMaterails = Materails.value;
    let sortedViolationMaterails = unsortedViolationMaterails.sort((a, b) => {
      if (a.Title < b.Title) {
        return -1;
      }
      if (a.Title > b.Title) {
        return 1;
      }
      return 0;
    });
    sortedViolationMaterails.forEach((Materail) => {
      if (Selector == "#quarryViolationRawType") {
        if (Materail.Ofender == "Quarry" || Materail.Ofender == "Both") {
          $(Selector).append(`
                        <option value="${Materail.Title}" data-code="${Materail.Code}" data-id="${Materail.ID}" data-price="${Materail.Price}">${Materail.Title}</option>
                    `);
        }
      } else if (Selector == "#carViolationRawType") {
        if (Materail.Ofender == "Vehicle" || Materail.Ofender == "Both") {
          $(Selector).append(`
                        <option value="${Materail.Title}" data-code="${Materail.Code}" data-id="${Materail.ID}" data-price="${Materail.Price}">${Materail.Title}</option>
                    `);
        }
      }
    });
  });
};
sharedApis.getQuarryType = (Selector) => {
  let Request = {
    ColumnName: "QuarryType",
  };
  functions
    .requester(
      "/_layouts/15/Uranium.Violations.SharePoint/Violations.aspx/GetChoices",
      { Request },
    )
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      let QuarryTypes = data.d.Result;
      QuarryTypes.forEach((quarryType) => {
        $(Selector).append(`
                <option value="${quarryType}">${quarryType}</option>
            `);
      });
    })
    .catch((err) => {
      console.log(err);
    });
};
sharedApis.getOffenderType = (Selector) => {
  let Request = {
    ColumnName: "OffenderType",
  };
  functions
    .requester(
      "/_layouts/15/Uranium.Violations.SharePoint/Violations.aspx/GetChoices",
      { Request },
    )
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      let OffenderTypes = data.d.Result;
      let OffenderArabicName;
      OffenderTypes.forEach((offenderType) => {
        if (offenderType == "Quarry") {
          OffenderArabicName = "محجر مخالف";
        } else if (offenderType == "Vehicle") {
          OffenderArabicName = "عربة مخالفة";
        } else {
          OffenderArabicName = "معدة مخالفة";
        }
        $(Selector).append(`
                <option value="${offenderType}">${OffenderArabicName}</option>
            `);
      });
    })
    .catch((err) => {
      console.log(err);
    });
};
sharedApis.getMaterialAmmount = (Selector) => {
  let Request = {
    ColumnName: "MaterialAmount",
  };
  functions
    .requester(
      "/_layouts/15/Uranium.Violations.SharePoint/Violations.aspx/GetChoices",
      { Request },
    )
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      let MaterialAmount = data.d.Result;
      MaterialAmount.forEach((amount) => {
        $(Selector).append(`
                <option value="${amount}">${amount}</option>
            `);
      });
    })
    .catch((err) => {
      console.log(err);
    });
};
sharedApis.getEquipments = (Selector) => {
  functions.callSharePointListApi("Equipments").then((Equipments) => {
    let EquipmentsData = Equipments.value;
    EquipmentsData.forEach((Equipment) => {
      $(Selector).find(".addNewToolBtn").before(`
                <div class="tool">
                    <label class="customelabel checkboxLabel" for="${Equipment.Title}">
                        <input type="checkbox" class="toolInput checkboxInput" value="${Equipment.Title}" name="${Equipment.Title}" id="${Equipment.Title}" data-price="${Equipment.Price}" data-id="${Equipment.ID}">
                        <span class="checkmark"></span>
                        <span class="checktext">${Equipment.Title}</span>
                    </label>
                    <input type="text" class="form-control customInput toolCount" id="toolCount" placeholder="العدد" value="1">
                </div>
            `);
    });
    $(".toolsBox .tool").each((index, tool) => {
      let SelectInput = $(tool).find(".toolInput");
      $(SelectInput).on("change", (e) => {
        $(e.currentTarget).parents(".tool").find(".toolCount").fadeToggle(200);
      });
    });
    $(".toolCount").on("keypress", (e) => {
      return functions.isNumberKey(e);
    });
    $(".toolCount").on("keyup", (e) => {
      if ($(e.currentTarget).val() == "" || $(e.currentTarget).val() == "0") {
        $(e.currentTarget).val("1");
      }
    });
  });
};
sharedApis.getCommitteeRecorder = (Selector, LeaderSelector) => {
  let UserId = _spPageContextInfo.userId;
  functions.callSharePointListApi("Configurations").then((Users) => {
    let UsersData = Users.value;
    let UserLeaderId;
    UsersData.forEach((User) => {
      if (User.UserIdId.find((id) => id == UserId)) {
        $(Selector).find(".committeeData").append(`
                    <h5 class="committeePersonName" data-sectorid="${User.SectorLeaderId}">${User.Title}</h5>
                    <p class="committeePersonRank">${User.Rank}</p>
                    <p class="committeePersonJop">${User.JobTitle1}</p>
                `);
        UserLeaderId = User.SectorLeaderId;
        sharedApis.getCommitteeSectorLeader(LeaderSelector, UserLeaderId);
      }
    });
  });
};
sharedApis.getCommitteeSectorLeader = (LeaderSelector, LeaderId) => {
  functions.callSharePointListApi("Configurations").then((Users) => {
    let UsersData = Users.value;
    UsersData.forEach((User) => {
      if (User.ID == LeaderId) {
        $(LeaderSelector).find(".committeeData").append(`
                    <h5 class="committeePersonName">${User.Title}</h5>
                    <p class="committeePersonRank">${User.Rank}</p>
                    <p class="committeePersonJop">${User.JobTitle1}</p>
                `);
      }
    });
  });
};
sharedApis.getCommitteeMember = (Selector) => {
  functions.callSharePointListApi("Configurations").then((Users) => {
    let UsersData = Users.value;
    UsersData.forEach((User) => {
      if (User.Type == "CommiteeMember") {
        $(Selector).find(".selectBox").children("select").append(`
                    <option value="${User.ID}" data-memberrank="${User.Rank}" data-jobtitle="${User.JobTitle1}"><span>${User.Rank}/</span> ${User.Title}</option>
                `);
      }
    });
  });
};
// sharedApis.checkCommitteeMember=()=>{
//     let memberData = {}
//     let MemberExist = false;
//     let CommitteeMemberId = $("#committeeMemberSelect").children("option:selected").val()
//     if(CommitteeMemberId != ""){
//         let CommitteeMemberName = $("#committeeMemberSelect").children("option:selected").text()
//         let CommitteeMemberRank = $("#committeeMemberSelect").children("option:selected").data("memberrank")
//         let CommitteeMemberJopTitle = $("#committeeMemberSelect").children("option:selected").data("jobtitle")
//         memberData ={
//             CommitteeMemberId:CommitteeMemberId,
//             CommitteeMemberName:CommitteeMemberName,
//             CommitteeMemberRank:CommitteeMemberRank,
//             CommitteeMemberJopTitle:CommitteeMemberJopTitle,
//         }
//         MemberExist = true;
//     }else{
//         // functions.warningAlert("من فضلك قم باضافة عضو اللجنة أولا")
//         MemberExist = false;
//     }
//     if(MemberExist){
//         return memberData;
//     }
//     return MemberExist;
// }
sharedApis.checkCommitteeMember = () => {
  let selectedMembersData = [];
  let memberData = {};
  let MemberExist = false;
  let selectedMembers = $("#committeeMemberSelect").children(
    "option:selected:not(:disabled)",
  );
  let CommitteeMemberId;
  let CommitteeMemberName;
  let CommitteeMemberRank;
  let CommitteeMemberJopTitle;
  if (selectedMembers.length > 0) {
    selectedMembers.each((index, member) => {
      CommitteeMemberId = Number($(member).val());
      CommitteeMemberName = $(member).text().split("/")[1].trim();
      CommitteeMemberRank = $(member).data("memberrank");
      CommitteeMemberJopTitle = $(member).data("jobtitle");
      memberData = {
        CommitteeMemberId: CommitteeMemberId,
        CommitteeMemberName: CommitteeMemberName,
        CommitteeMemberRank: CommitteeMemberRank,
        CommitteeMemberJopTitle: CommitteeMemberJopTitle,
        CommitteeMemberFullName:
          $(member).data("memberrank") +
          "/ " +
          $(member).text().split("/")[1].trim() +
          "/ " +
          $(member).data("jobtitle"),
      };

      selectedMembersData.push(memberData);
    });

    MemberExist = true;
  } else {
    MemberExist = false;
  }
  // selectedMembersIds.push(CommitteeMemberId)
  // console.log("selectedMembersIds",selectedMembersIds)
  // if(CommitteeMemberId != ""){
  //     memberData ={
  //         CommitteeMemberId:CommitteeMemberId,
  //         CommitteeMemberName:CommitteeMemberName,
  //         CommitteeMemberRank:CommitteeMemberRank,
  //         CommitteeMemberJopTitle:CommitteeMemberJopTitle,
  //     }
  //     MemberExist = true;
  // }else{
  //     // functions.warningAlert("من فضلك قم باضافة عضو اللجنة أولا")
  //     MemberExist = false;
  // }
  if (MemberExist) {
    return selectedMembersData;
  }
  return MemberExist;
};
sharedApis.getCarType = (Selector) => {
  let Request = {
    ColumnName: "VehicleType",
  };
  functions
    .requester(
      "/_layouts/15/Uranium.Violations.SharePoint/Violations.aspx/GetChoices",
      { Request },
    )
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      let CarTypes = data.d.Result;
      CarTypes.forEach((carType) => {
        $(Selector).append(`
                <option value="${carType}">${carType}</option>
            `);
      });
    })
    .catch((err) => {
      console.log(err);
    });
};
sharedApis.getTrafficName = (Selector) => {
  let Request = {
    ColumnName: "TrafficName",
  };
  functions
    .requester(
      "/_layouts/15/Uranium.Violations.SharePoint/Violations.aspx/GetChoices",
      { Request },
    )
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      let CarTraffics = data.d.Result;
      CarTraffics.forEach((carTraffic) => {
        $(Selector).append(`
                <option value="${carTraffic}">${carTraffic}</option>
            `);
        // $("#driverLicenseTraffic").append(`
        //     <option value="${carTraffic}">${carTraffic}</option>
        // `)
      });
    })
    .catch((err) => {
      console.log(err);
    });
};
sharedApis.getUserDetails = () => {
  let UserId = _spPageContextInfo.userId;
  functions.callSharePointListApi("Configurations").then((Users) => {
    let UsersData = Users.value;
    UsersData.forEach((User) => {
      if (
        User.UserIdId.find((id) => id == UserId) &&
        User.JobTitle1 == "القائم بالضبط"
      ) {
        functions.setUserDetailsSideMenu(
          "Recorder",
          User.JobTitle1,
          User.NameAr,
        );
      } else if (
        User.UserIdId.find((id) => id == UserId) &&
        User.JobTitle1 == "فرع المخالفات"
      ) {
        functions.setUserDetailsSideMenu("Branch", User.JobTitle1, "");
      } else if (
        User.UserIdId.find((id) => id == UserId) &&
        User.JobTitle1 == "مسؤول التصديقات"
      ) {
        functions.setUserDetailsSideMenu("Certification", User.JobTitle1, "");
      } else if (
        User.UserIdId.find((id) => id == UserId) &&
        User.JobTitle1 == "الشركة المصرية للتعدين"
      ) {
        functions.setUserDetailsSideMenu("MiningCompany", User.JobTitle1, "");
      } else if (User.UserIdId.find((id) => id == UserId)) {
        functions.setUserDetailsSideMenu("", User.JobTitle1, "");
      }
    });
  });
};
sharedApis.getPaymentStatus = (Selector) => {
  let Request = {
    ColumnName: "PaymentStatus",
  };
  functions
    .requester(
      "/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/GetChoices",
      { Request },
    )
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      let PaymentStatus = data.d.Result;
      PaymentStatus.forEach((payStatus) => {
        $(Selector).append(`
                <option value="${payStatus}">${payStatus}</option>
            `);
      });
    })
    .catch((err) => {
      console.log(err);
    });
};
sharedApis.getViolationStatus = (Selector) => {
  let Request = {
    ColumnName: "Status",
  };
  functions
    .requester(
      "/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/GetChoices",
      { Request },
    )
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      let ViolationsStatus = data.d.Result;
      let arabicStatusName;
      ViolationsStatus.forEach((violationStatus) => {
        switch (violationStatus) {
          case "Confirmed": {
            arabicStatusName = "قيد الإنتظار";
            break;
          }
          case "Paid": {
            arabicStatusName = "تم السداد";
            break;
          }
          case "Exceeded": {
            arabicStatusName = "تجاوز مدة السداد";
            break;
          }
          case "Paid After Reffered": {
            arabicStatusName = "سداد بعد الإحالة";
            break;
          }
          case "Saved": {
            arabicStatusName = "حفظ بعد الإحالة";
            break;
          }
          case "Completed": {
            arabicStatusName = "تم الانتهاء";
            break;
          }
        }
        if (
          violationStatus != "Pending" &&
          violationStatus != "Approved" &&
          violationStatus != "Rejected" &&
          violationStatus != "Reffered"
        ) {
          $(Selector).append(`
                    <option value="${violationStatus}">${arabicStatusName}</option>
                `);
        }
      });
    })
    .catch((err) => {
      console.log(err);
    });
};
sharedApis.getCasesStatus = (Selector) => {
  let Request = {
    ColumnName: "Status",
  };
  functions
    .requester(
      "/_layouts/15/Uranium.Violations.SharePoint/Cases.aspx/GetChoices",
      { Request },
    )
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      let CasesStatus = data.d.Result;
      CasesStatus.forEach((Status) => {
        $(Selector).append(`
                <option value="${Status}">${Status}</option>
            `);
      });
    })
    .catch((err) => {
      console.log(err);
    });
};
sharedApis.getPetitionsStatus = (Selector) => {
  let Request = {
    ColumnName: "Status",
  };
  functions
    .requester(
      "/_layouts/15/Uranium.Violations.SharePoint/Petitions.aspx/GetChoices",
      { Request },
    )
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      let PetitionStatus = data.d.Result;
      PetitionStatus.forEach((Status) => {
        $(Selector).append(`
                <option value="${Status}">${Status}</option>
            `);
      });
    })
    .catch((err) => {
      console.log(err);
    });
};
export default sharedApis;

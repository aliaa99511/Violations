import functions from "../Shared/functions";
// names convention is:  ajaxDatatable is function name / Table Name / Init is static

// ajaxDatatable for history init
const ajaxDatatableHistoryInit = function (table, url, request, columns) {
  // defiend all columns here so we can use what ever we want
  const allColumns = {
    id: {
      data: "Id",
      name: "Id",
      render: function (row) {        
        return row;
      },
    },
    status: {
      data: "Status",
      name: "Status",
      render: function (row) {
        return row;
      },
    },
    created: {
      data: "Created",
      name: "Created",
      render: function (row) {
        return row != "" ? functions.getFormatedDate(row) : "-";
      },
    },
    createdBy: {
      data: "CreatedBy",
      name: "CreatedBy",
      render: function (row) {
        return row;
      },
    },
    comment: {
      data: "Comment",
      name: "Comment",
      render: function (row) {
        return row;
      },
    },
  };
  const usedColumnes = [];
  // pass columns in function as array so we can loop over allColumnes and get what ever column we want
  columns.map((column) => {
    usedColumnes.push(allColumns[column]);
  });

    var table = table.DataTable({
      processing: true,
      paging: false,
      responsive: true,
      ajax: {
        url: url,
        contentType: "application/json",
        type: "POST",
        data: function () {
          return JSON.stringify(request);
        },
        dataSrc: function (data) {          
          if (data?.d.Result != null) {            
            $(".modal-violation-code").text(data.d.Result.GridData.ViolationCode);
            return data.d.Result.GridData;
          }else{
            return []
          }
        },
      },
      columns: usedColumnes,
      "language": {
        "emptyTable": "لا توجد بيانات متاحة",
        'loadingRecords': "يتم تحميل البيانات"
      }
    });
    return table;
};
export { ajaxDatatableHistoryInit };

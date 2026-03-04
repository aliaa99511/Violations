import functions from "../Shared/functions";

export const ajaxDatatableHistoryInit = (table, url, request, columns) => {

  // 🔥 لو الجدول معمول له init قبل كده ندمّره
  if ($.fn.DataTable.isDataTable(table)) {
    table.DataTable().clear().destroy();
    table.find("tbody").empty();
  }

  const allColumns = {
    id: {
      data: "Id",
      name: "Id",
    },

    status: {
      data: "Status",
      name: "Status",
    },

    created: {
      data: "Created",
      name: "Created",
      render: (data) =>
        data ? functions.getFormatedDate(data) : "-",
    },

    createdBy: {
      data: "CreatedBy",
      name: "CreatedBy",
    },

    comment: {
      data: "Comment",
      name: "Comment",
    },
  };

  const usedColumns = columns.map((col) => allColumns[col]);

  return table.DataTable({
    processing: true,
    paging: false,
    responsive: true,
    destroy: true,

    ajax: {
      url: url,
      type: "POST",
      contentType: "application/json",

      data: () => JSON.stringify(request),

      dataSrc: (data) => {

        if (data?.d?.Result) {

          $(".modal-violation-code").text(
            data.d.Result.GridData?.[0]?.ViolationCode || ""
          );

          return data.d.Result.GridData || [];
        }

        return [];
      },
    },

    columns: usedColumns,

    language: {
      emptyTable: "لا توجد بيانات متاحة",
      loadingRecords: "يتم تحميل البيانات",
    },
  });
};
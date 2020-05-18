// ==UserScript==
// @name         ASM - Abrir tarefa em nova aba
// @namespace    http://tampermonkey.net/
// @version      0.31
// @description  Toma essa ASM!!!
// @author       Calebe
// @match        https://asm.procempa.com.br/View/Web/Forms/FrmListTask.aspx*
// @grant        GM.getValue
// @grant        GM.setValue
// ==/UserScript==

(function() {
    const tableStorageKey = "tasksLoader";
    const defaultTable = `<div id="tasksLoader"><table class="dxgvTable_Aqua"><tbody><tr><th class="dxgvHeader_Aqua">Tarefa</th><th class="dxgvHeader_Aqua">Link</th><th class="dxgvHeader_Aqua">Excluir</th></tr></tbody></table></div>`;

    const scr = document.createElement('script');
    scr.innerHTML = `
      let getTaskUrl = async function (index) {
        const getCallBackParam = function (index) {
            var cKV = $(
                "#ctl00_phMain_pnlMain_UcViewManagerList_grvObjectCatalog_DXKVInput"
            ).val();
            var cFR = index + ""; //$("#ctl00_phMain_pnlMain_UcViewManagerList_grvObjectCatalog_DXFocusedRowInput").val();
            var cCR = $(
                "#ctl00_phMain_pnlMain_UcViewManagerList_grvObjectCatalog_DXColResizedInput"
            ).val();

            return (
                "c0:" +
                "KV|" +
                cKV.length +
                ";" +
                cKV +
                ";" +
                "FR|" +
                cFR.length +
                ";" +
                cFR +
                ";" +
                "CR|" +
                cCR.length +
                ";" +
                cCR +
                ";" +
                "GB|19;14|CUSTOMCALLBACK0|;"
            );
        };
        $("#ctl00_hdnContext_I").val(
            "12|#|defaultStyleCSS|4|23|1../../../css/style.cssAction|4|8|1nviEdit#"
        );
        $(
            "#ctl00_phMain_pnlMain_UcViewManagerList_grvObjectCatalog_DXFocusedRowInput"
        ).val(index);
        $(
            "#ctl00_phMain_pnlMain_UcViewManagerList_grvObjectCatalog_DXColResizedInput"
        ).val('{"ctrlWidth":1571}');
        $("#ctl00_phMain_pnlMain_txtRegisters").val(index);
        if ($("#__CALLBACKID").length == 0) {
            $("#aspnetForm").append(
                $("<input>").attr({
                    type: "hidden",
                    name: "__CALLBACKID",
                    id: "__CALLBACKID",
                })
            );
        }
        if ($("#__CALLBACKPARAM").length == 0) {
            $("#aspnetForm").append(
                $("<input>").attr({
                    type: "hidden",
                    name: "__CALLBACKPARAM",
                    id: "__CALLBACKPARAM",
                })
            );
        }
        $("#__CALLBACKID").val(
            "ctl00$phMain$pnlMain$UcViewManagerList$grvObjectCatalog"
        );
        $("#__CALLBACKPARAM").val(getCallBackParam(index));

        var promise = await $.post(
            "https://asm.procempa.com.br/View/Web/Forms/FrmListTask.aspx?MenuNameParent=liMniTasks",
            $("#aspnetForm").serialize()
        );
        let m = promise.match(/'redirect':'(.+?)',/);
        if (m) return m[1];
        throw promise;
    };

    let getColumnIndex = function (headerText) {
        let index = -1;
        document
            .querySelector(
            "#ctl00_phMain_pnlMain_UcViewManagerList_grvObjectCatalog_DXHeadersRow0"
        )
            .childNodes.forEach(function (e, i) {
            if (e.innerText && e.innerText.match(headerText)) {
                index = i;
                return;
            }
        });

        return index;
    };

    let getTaskRow = function (task) {
        let tr = null;
        document
            .querySelectorAll("#tasksLoader tr.dxgvDataRow_Aqua")
            .forEach(function (e) {
            const td = e.querySelectorAll("td");
            if (td[0].innerText == task) {
                tr = e;
            }
        });
        return tr;
    };

    let updateTaskRow = function (task, text = "Carregando...") {
        const tr = getTaskRow(task);
        if(tr) {
            tr.childNodes[1].innerHTML = text;
        } else {
            const table = document.querySelector("#tasksLoader table.dxgvTable_Aqua tbody");
            table.insertAdjacentHTML(
                "beforeend",
                "<tr class='dxgvDataRow_Aqua'><td class='dxgv'>" +
                task +
                "</td><td class='dxgv'>" +
                text +
                "</td><td class='dxgv' style='text-align: center;'><img title='Excluir' style='cursor:pointer' src='../../../Images/cross.png' onclick='deleteLine(this)'></td></tr>"
            );
        }
    };

    let deleteLine = function(element) {
        element.parentNode.parentNode.remove();
    };

    let getTask = function (index, element) {
        const idx = getColumnIndex("Número");
        if (idx === -1) {
            alert("Coluna Número não encontrada!");
            console.error("Coluna Número não encontrada!");
            return;
        }

        const taskNumber =
              element.parentElement.parentElement.childNodes[idx].innerText;
        updateTaskRow(taskNumber);
        getTaskUrl(index).then(function (data) {
            if (!data) {
                console.error("Link não obtido");
                return;
            }

            const url = "http://asm.procempa.com.br/View/Web/Forms/" + data;
            updateTaskRow(
                taskNumber,
                "<a href=" + url + " target='_blank'>" + url + "</a>"
            );
        });
    };`;

    let updateLinks = function () {
        document
            .querySelectorAll(".dxgvCommandColumn_Aqua > img[title='Editar']")
            .forEach(function (e) {
            var r = e
            .getAttribute("onclick")
            .match(/\['CustomButton','nviEdit',([0-9]+)\].*$/);

            if (!r) return;

            var index = r[1];
            if (index !== null && index !== undefined)
                e.setAttribute("onclick", `getTask(${index}, this)`);
        });
    };

    const storeTable = function() {
        setInterval(
        function() {
            if(document.querySelector("#tasksLoader"))
                GM.setValue(tableStorageKey, document.querySelector("#tasksLoader").outerHTML);
        },
        1000
    )};

    GM.getValue(tableStorageKey, defaultTable).then(function(data) {
        document.querySelector("#floatingNavmenu").insertAdjacentHTML(
            "beforeend", data
        );
        storeTable();
    });

    setInterval(
        updateLinks,
        500
    );



    document.body.appendChild(scr);


})();
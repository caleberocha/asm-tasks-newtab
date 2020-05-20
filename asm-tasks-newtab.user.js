// ==UserScript==
// @name         ASM - Abrir tarefa em nova aba
// @namespace    http://tampermonkey.net/
// @version      0.32
// @description  Toma essa ASM!!!
// @author       Calebe
// @match        https://asm.procempa.com.br/View/Web/Forms/FrmListTask.aspx*
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.deleteValue
// ==/UserScript==

(function() {
    const idTableKey = "tasksLoader";
    const idTableShadowCopy = idTableKey + "ShadowCopy";
    const defaultTable = `<table><thead><tr><th>Tarefa</th><th>Link</th><th>Excluir</th></tr></thead><tbody></tbody></table>`;

    const divContainer = document.createElement("div");
    divContainer.id = idTableKey;

    const divContainerShadowCopy = document.createElement("div");
    divContainerShadowCopy.id = idTableShadowCopy;
    divContainerShadowCopy.style.display = "none";

    // GM.deleteValue(idTableKey);
    const scr = document.createElement('script');
    scr.innerHTML = `
      const getTaskUrl = async function (index) {
        const getCallBackParam = function (index) {
            var cKV = $(
                "#ctl00_phMain_pnlMain_UcViewManagerList_grvObjectCatalog_DXKVInput"
            ).val();
            var cFR = index + "";
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
            "FrmListTask.aspx?MenuNameParent=liMniTasks",
            $("#aspnetForm").serialize()
        );
        let m = promise.match(/'redirect':'(.+?)',/);
        if (m) return m[1];
        throw promise;
    };

    const getColumnIndex = function (headerText) {
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

    const getTaskRow = function (task) {
        let tr = null;
        document
            .querySelectorAll("#${idTableKey} > table > tbody > tr")
            .forEach(function (e) {
            const td = e.querySelectorAll("td");
            if (td.length > 0 && td[0].innerText == task) {
                tr = e;
            }
        });
        return tr;
    };

    const updateTaskRow = function (task, text = "Carregando...") {
        const tr = getTaskRow(task);
        if(tr) {
            tr.childNodes[1].innerHTML = text;
            tr.scrollIntoViewIfNeeded();
        } else {
            const table = document.querySelector("#${idTableKey} > table > tbody");
            const trc = document.createElement("tr");
            trc.innerHTML = "<td>" +
                task +
                "</td><td>" +
                text +
                "</td><td>" +
                "<img title='Excluir' src='../../../Images/cross.png' onclick='deleteLine(this)'>" +
                "</td>";
            trc.className = "dxgvDataRow_Aqua";
            trc.querySelectorAll("td").forEach(function(e) {e.className = "dxgv"});
            table.insertAdjacentElement(
                "beforeend",
                trc
            );
            trc.scrollIntoViewIfNeeded();
        }
    };

    const deleteLine = function(element) {
        element.parentNode.parentNode.remove();
    };

    const getTask = function (index, element) {
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

            updateTaskRow(
                taskNumber,
                "<a href=" + data + " target='asm_task_" + taskNumber + "'>" + data + "</a>"
            );
        });
    };`;

    const updateLinks = function () {
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

    const applyCss = function() {
        const style = `
            <style>
            #${idTableKey} {
                max-height: 10.5em;
                width: fit-content;
                overflow-y: auto;
            }
            #${idTableKey} > table {
                vertical-align: middle;
            }
            #${idTableKey} > table > tbody > tr > td:nth-child(3) {
                text-align: center;
            }
            #${idTableKey} > table > tbody > tr > td:nth-child(3) > img {
                cursor: pointer;
            }
            </style>
        `;

        document.head.insertAdjacentHTML("beforeend", style);

        document.querySelector(`#${idTableKey} > table`).className = "dxgvTable_Aqua";
        document.querySelectorAll(`#${idTableKey} > table > tbody > tr`).forEach(function(e) {e.className = "dxgvDataRow_Aqua"});
        document.querySelectorAll(`#${idTableKey} > table th`).forEach(function(e) {e.className = "dxgvHeader_Aqua"});
        document.querySelectorAll(`#${idTableKey} > table > tbody td`).forEach(function(e) {e.className = "dxgv"});
    }

    const storeTable = function() {
        setInterval(
        function() {
            if(document.querySelector(`#${idTableKey}`)) {
                document.querySelector(`#${idTableShadowCopy}`).innerHTML = document.querySelector(`#${idTableKey}`).innerHTML;
                document.querySelectorAll(`#${idTableShadowCopy} *`).forEach(function(e) {e.removeAttribute("style"); e.removeAttribute("class");})
                GM.setValue(idTableKey, document.querySelector(`#${idTableShadowCopy}`).innerHTML);
            }
        },
        1000
    )};

    GM.getValue(idTableKey, defaultTable).then(function(data) {
        const m = data.match(/(\<table.+\<\/table\>)/);
        if(m)
            data = m[1];
        document.body.insertAdjacentElement("beforeend", divContainerShadowCopy);
        document.querySelector("#floatingNavmenu").insertAdjacentElement(
            "beforeend", divContainer
        ).insertAdjacentHTML(
            "beforeend", data
        );
        applyCss();
        storeTable();
    });

    setInterval(
        updateLinks,
        500
    );

    document.body.appendChild(scr);
})();
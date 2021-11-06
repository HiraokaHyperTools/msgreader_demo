const bootstrap = require('bootstrap');
const MsgReader = require('@kenjiuno/msgreader').default;
import 'bootstrap/dist/css/bootstrap.min.css';
import 'jsoneditor/dist/jsoneditor.min.css';
const JSONEditor = require('jsoneditor');
const { decompressRTF } = require('@kenjiuno/decompressrtf');
const { Buffer } = require('buffer');
import * as rxjs from 'rxjs';

{
    const { version } = require('@kenjiuno/msgreader/package.json');
    const applyReplace = function (src) {
        return src.replace(/{version}/g, version);
    }
    document.title = applyReplace(document.title);
    document.querySelectorAll(".my-substitution-target").forEach(
        element => {
            element.textContent = applyReplace(element.textContent);
        }
    )
}

const container = document.getElementById('editor_holder');
const options = {};
const editor = new JSONEditor(container, options);

function recoverCompressedRtf(msg) {
    const attachments = msg.attachments ? msg.attachments.map(
        sub => {
            const newSub = Object.assign({}, sub);
            if (newSub.innerMsgContentFields) {
                newSub.innerMsgContentFields = recoverCompressedRtf(sub.innerMsgContentFields);
            }
            return newSub;
        }
    ) : undefined;

    const newMsg = Object.assign({}, msg);
    if (newMsg.compressedRtf !== undefined) {
        newMsg.rtf = Buffer.from(decompressRTF(newMsg.compressedRtf)).toString("ascii");
        delete newMsg.compressedRtf;
    }
    if (attachments !== undefined) {
        newMsg.attachments = attachments;
    }
    return newMsg;
}

const wip = document.getElementById('wip');
const errorPanel = document.getElementById('errorPanel');
const clearAnsiEncoding = document.getElementById('clearAnsiEncoding');

clearAnsiEncoding.addEventListener('click', function () {
    document.getElementById("ansiEncoding").value = "";
    document.getElementById("ansiEncoding").dispatchEvent(new Event("change"));
});

rxjs.combineLatest([
    // #msgFile
    rxjs.fromEvent(
        document.getElementById("msgFile"),
        'change'
    )
        .pipe(
            rxjs.map(
                e => e.target.files
            )
        ),
    // #ansiEncoding
    rxjs.fromEvent(
        document.getElementById("ansiEncoding"),
        'change'
    )
        .pipe(
            rxjs.map(
                e => e.target.value
            ),
            rxjs.startWith(null)
        ),
    // #includeRawProps
    rxjs.fromEvent(
        document.getElementById("includeRawProps"),
        'change'
    )
        .pipe(
            rxjs.map(
                e => e.target.checked
            ),
            rxjs.startWith(false)
        ),
])
    .subscribe(
        set => {
            const [fileList, ansiEncoding, includeRawProps] = set;

            rxjs
                .from(fileList)
                .pipe(
                    rxjs.take(1)
                )
                .subscribe(
                    file => {
                        const reader = new FileReader();

                        wip.style.display = '';
                        errorPanel.style.display = 'none';

                        rxjs.fromEvent(
                            reader,
                            'load'
                        )
                            .pipe(
                                rxjs.take(1),
                                rxjs.map(
                                    e => e.target.result
                                ),
                                rxjs.finalize(
                                    () => wip.style.display = 'none'
                                ),
                                rxjs.map(
                                    arrayBuffer => {
                                        const testMsg = new MsgReader(arrayBuffer);
                                        testMsg.parserConfig = {
                                            ansiEncoding,
                                            includeRawProps,
                                        }

                                        const testMsgInfo = testMsg.getFileData();

                                        console.info(testMsgInfo);

                                        return recoverCompressedRtf(testMsgInfo);
                                    }
                                )
                            )
                            .subscribe({
                                next: msgInfo => {
                                    editor.set(msgInfo);
                                },
                                error: ex => {
                                    errorPanel.style.display = '';
                                    errorPanel.textContent = ex + "";
                                }
                            });

                        reader.readAsArrayBuffer(file);
                    }
                );
        }
    );

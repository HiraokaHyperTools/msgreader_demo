declare const BUILT_AT: string;

import 'bootstrap';
import MsgReader from '@kenjiuno/msgreader';
import { FieldsData } from '@kenjiuno/msgreader/lib/MsgReader';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'jsoneditor/dist/jsoneditor.min.css';
import JSONEditor from 'jsoneditor';
import { decompressRTF } from '@kenjiuno/decompressrtf';
import { Buffer } from 'buffer';
import * as rxjs from 'rxjs';

{
    const { version } = require('@kenjiuno/msgreader/package.json');
    const applyReplace = function (src: string): string {
        return src
            .replace(/{version}/g, version)
            .replace(/{build}/g, BUILT_AT);
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

function recoverCompressedRtf(msg: FieldsData) {
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
        Object.defineProperty(newMsg, "rtf", {
            value: Buffer.from(decompressRTF(Array.from(newMsg.compressedRtf))).toString("ascii"),
        });
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
const ansiEncoding = document.getElementById("ansiEncoding") as HTMLInputElement;
const msgFile = document.getElementById("msgFile") as HTMLInputElement;
const includeRawProps = document.getElementById("includeRawProps") as HTMLInputElement;

clearAnsiEncoding.addEventListener('click', function () {
    ansiEncoding.value = "";
    ansiEncoding.dispatchEvent(new Event("change"));
});

rxjs.combineLatest([
    // #msgFile
    rxjs.fromEvent(
        msgFile,
        'change'
    )
        .pipe(
            rxjs.map(
                e => (e.target as HTMLInputElement).files
            )
        ),
    // #ansiEncoding
    rxjs.fromEvent(
        ansiEncoding,
        'change'
    )
        .pipe(
            rxjs.map(
                e => (e.target as HTMLInputElement).value
            ),
            rxjs.startWith(null)
        ),
    // #includeRawProps
    rxjs.fromEvent(
        includeRawProps,
        'change'
    )
        .pipe(
            rxjs.map(
                e => (e.target as HTMLInputElement).checked
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
                                    e => (e.target as FileReader).result as ArrayBuffer
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

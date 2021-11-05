const bootstrap = require('bootstrap');
const MsgReader = require('@kenjiuno/msgreader').default;
import 'bootstrap/dist/css/bootstrap.min.css';
import 'jsoneditor/dist/jsoneditor.min.css';
const JSONEditor = require('jsoneditor');
const { decompressRTF } = require('@kenjiuno/decompressrtf');
const { Buffer } = require('buffer');

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
    const attachments = msg.attachments.map(
        sub => {
            const newSub = Object.assign({}, sub);
            if (newSub.innerMsgContentFields) {
                newSub.innerMsgContentFields = recoverCompressedRtf(sub.innerMsgContentFields);
            }
            return newSub;
        }
    );

    const newMsg = Object.assign({}, msg);
    if (newMsg.compressedRtf !== undefined) {
        newMsg.rtf = Buffer.from(decompressRTF(newMsg.compressedRtf)).toString("ascii");
        delete newMsg.compressedRtf;
    }
    newMsg.attachments = attachments;
    return newMsg;
}

document
    .querySelector("#msgFile")
    .addEventListener("change", (event) => {
        const fileList = event.target.files;
        for (let file of fileList) {
            const reader = new FileReader();
            reader.addEventListener('load', (event) => {
                const arrayBuffer = event.target.result;

                const testMsg = new MsgReader(arrayBuffer);
                const testMsgInfo = testMsg.getFileData();

                console.info(testMsgInfo);
                editor.set(recoverCompressedRtf(testMsgInfo));
            });
            reader.readAsArrayBuffer(file);
            break;
        }
    });

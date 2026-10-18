import test from 'node:test';
import assert from 'node:assert/strict';
import {validateUpload} from '../src/core/uploads.js';
const pdf=new File(['%PDF-1.7\ncontent'],'cv.pdf',{type:'application/pdf'});
test('CV upload requires a PDF signature and PDF extension',async()=>{
 assert.deepEqual(await validateUpload(pdf,'cv'),{extension:'pdf',contentType:'application/pdf'});
 await assert.rejects(validateUpload(new File(['<script>test</script>'],'cv.pdf'),'cv'),/valid PDF/);
 await assert.rejects(validateUpload(new File(['%PDF-1.7'],'cv.html'),'cv'),/valid PDF/);
});
test('receipts reject renamed documents and mismatched image signatures',async()=>{
 const png=new File([new Uint8Array([137,80,78,71,13,10,26,10])],'receipt.png');
 assert.equal((await validateUpload(png,'proof')).contentType,'image/png');
 await assert.rejects(validateUpload(new File(['%PDF-1.7'],'receipt.png'),'proof'),/JPG or PNG/);
 await assert.rejects(validateUpload(new File([new Uint8Array([137,80,78,71,13,10,26,10])],'receipt.jpg'),'proof'),/JPG or PNG/);
});
test('empty and oversized uploads fail before storage is contacted',async()=>{
 await assert.rejects(validateUpload(new File([],'receipt.png'),'proof'),/Choose a file/);
 await assert.rejects(validateUpload(new File([new Uint8Array(5*1024*1024+1)],'receipt.png'),'proof'),/smaller than 5 MB/);
});

const PDFDocument = require('pdfkit');
const fs = require('fs');
var QRCode = require('qrcode');
const doc = new PDFDocument();
var zip = require('express-zip');
var pdf = require('html-pdf-node');
const fzip  = require('zip-a-folder');

const removeDir = function(path) {
  if (fs.existsSync(path)) {
    const files = fs.readdirSync(path)

    if (files.length > 0) {
      files.forEach(function(filename) {
        if (fs.statSync(path + "/" + filename).isDirectory()) {
          removeDir(path + "/" + filename)
        } else {
          fs.unlinkSync(path + "/" + filename)
        }
      })
      fs.rmdirSync(path)
    } else {
      fs.rmdirSync(path)
    }
  } else {
    console.log("Directory path not found.")
  }
}

exports.downloadSheet = (req, res, next) => {

    var Model = require('../model/attendance');
    Model.findOne({ title: req.body.title }, async function  (err, sheet)  {
    
        if (err || !sheet) {
            res.json({ success: 'False', data: 'No Sheet Found' });
        } else {
            var rep = []
            for (i of sheet.data) {
                if (i['id'] === "0") continue;
                i['title'] = req.body;
                await QRCode.toFile(i['id'] +'.png', JSON.stringify(i));
                rep.push({path: i['id'] + '.png', name: i['id']});
            }
            await res.zip(rep,"sheet.zip", ()=>{
                for (i of sheet.data) {
                    fs.unlink(i['id'] + '.png', (err) => {
                    });
                }
            });
        }
    });
};

exports.downloadData = (req, res, next) => {
    var Model = require('../model/data');
    Model.find({ etitle: req.body.etitle, ftitle: req.body.ftitle }, async function (err, form) {

        if (err || !form) {
            res.json({ success: 'False', data: 'No Form Found' });
        } else {
            var rep = []
            var k = 0;
            for (i of form) {

                var decoded = JSON.parse(i.data);
                await fs.mkdir(k.toString(), () => {});
                const doc = new PDFDocument({ layout: 'portrait', size: 'A4', });
                doc.pipe(fs.createWriteStream(k.toString() + '/' + form[0].etitle + "_" + form[0].ftitle + '.pdf'));

                for(var j = 0; j <  i.file.length; j++)
                {
                    //console.log(i.file[j].name);
                    await fs.writeFile(k.toString() + '/' + i.file[j].name, i.file[j].file, 'binary', () => { });
                }

                doc
                    .fontSize(48)
                    .fill('#021c27')
                    .text(form[0].etitle, {
                        align: 'center',
                    });
                doc
                    .fontSize(36)
                    .fill('#021c27')
                    .text(form[0].ftitle, {
                        align: 'center',
                    });
                doc.lineWidth(10);
                doc.lineCap('round')
                    .moveTo(150, 50)
                    .lineTo(450, 50)
                    .stroke();
                doc.lineCap('round')
                    .moveTo(150, 180)
                    .lineTo(450, 180)
                    .stroke();
                jumpLine(doc, 3);

                for(var key in decoded)
                {
                    if (key !== "undefined" && key !== "fname" && key !== "ename")
                    {
                        doc
                            .fontSize(36)
                            .fill('#021c27')
                            .text(key + ": " + decoded[key], {
                                align: 'left',
                            });
                    }
                }
                doc
                    .fontSize(36)
                    .fill('#021c27')
                    .text("------------------------------------", {
                        align: 'left',
                    });
                jumpLine(doc, 2);
                await doc.end();
                await fzip.zip(k.toString(), k.toString() + '.zip');
                rep.push({ path: k.toString() + '.zip' , name: k.toString() + '.zip'});    
                k++;
            }

            await res.zip(rep, "form_data.zip", async () => {
                for (var j = 0; j < k; j++) {
                    await removeDir(j.toString());
                    await fs.unlink(j.toString() + '.zip', (err) => {
                    });
                }
            });
        }
    });
};

var genTypeOne = () => {

}

var genTypeTwo = () => {

}

var genTypeThree = () => {

}

var genTypeFour = async (res, sheet) => {
    var rep = []

    console.log(sheet);

    for (i of sheet.data) {

        //if (i['id'] === "0" || i['presence'] === "0") continue;

        var file = { content: "<h1>Welcome to html-pdf-node</h1>" };
        var options = { path: i['id'] + '.pdf', format: 'A4' }

        await pdf.generatePdf(file, options).then(buf => {
            //console.log(buf);
        });
        rep.push({ path: i['id'] + '.pdf', name: i['id'] })
    }

    await res.zip(rep, "certificate.zip", () => {
        for (i of sheet.data) {
            fs.unlink(i['id'] + '.pdf', (err) => {
            });
        }
    });
}

exports.downloadCertificate = (req, res, next) => {

    var csv = req.files[0];
    var type = req.body.type;

    var Model = require('../model/attendance');
    Model.findOne({ title: req.body.title }, async function (err, sheet) {

        if (err || !sheet) {
            res.json({ success: 'False', data: 'No Sheet Found' });
        } else {

            switch (type) {
                case "Participation":
                    genTypeOne();
                    break;
                case "Winner":
                    genTypeTwo();
                    break;
                case "Runner Up":
                    genTypeThree();
                    break;
                case "Attendance":
                    await genTypeFour(res, sheet);
                    break;
            }
        }
    });
};

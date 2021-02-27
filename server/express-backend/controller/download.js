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

exports.verifyCertificate = (req, res, next) => {
    
}

var genTypeOne = () => {

}

var genTypeTwo = () => {

}

var genTypeThree = () => {
    res.send({});
}

var genTypeFour = async (req, res, sheet) => {
    var rep = []

    console.log(sheet);

    for (i of sheet.data) {

        //if (i['id'] === "0" || i['presence'] === "0") continue;

        var uid = (+new Date).toString(36);
        var verfiyLink = "http://localhost:3001/verfiy?uid=" + uid;

        var file = {
            content: `<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Certificate</title>
    <style>

    #certificate{background: linear-gradient(#c8be75 50%, rgba(255,255,255,0) 0) 0 0, radial-gradient(circle closest-side, #c8be75 50%, rgba(255,255,255,0) 0) 0 0, radial-gradient(circle closest-side, #c8be75 0%, rgba(255,255,255,0) 0) 55px 0 #FFF;background-size: 10.5in 8in;background-repeat: repeat-x;}
    body{ margin: 0;}
    
    @media print {
        table{background: linear-gradient(#c8be75 50%, rgba(255,255,255,0) 0) 0 0, radial-gradient(circle closest-side, #c8be75 50%, rgba(255,255,255,0) 0) 0 0, radial-gradient(circle closest-side, #c8be75 0%, rgba(255,255,255,0) 0) 55px 0 #FFF;background-size: 10.5in 8in;background-repeat: repeat-x; -webkit-print-color-adjust: exact; }
    }
    
    @page {
        margin-top: 0.5cm;
        margin-bottom: 2cm;
        margin-left: 2cm;
        margin-right: 2cm;
    }

    </style>
</head>
<body>
<button onclick="myFunction()">Print this page</button>
<script>
        function myFunction() {
            window.print();
        }
</script>

    <div class="certificate-container" style="background:#f9f9f9">
        <table id="certificate" style="width: 11in;margin: 0 auto;text-align: center;padding: 10px;border-style: groove;border-width: 20px;outline: 5px dotted #000;height: 8.5in;outline-offset: -26px;outline-style: double;border-color: #9d8b00;">
            <tr>
                <td><h1 style="font-size: 0.6in; margin: 0; color: #000;">Attendance Certificate</h1><h3 style="margin: 0;font-size: 0.25in;color: black;text-transform: uppercase;font-family: sans-serif;">`+ req.body.title +`</h3> <p style="font-size: 0.2in;text-transform: uppercase;color: #494000;">Is hereby granted to :</p></td>
            </tr>
            <tr>
                <td>
                    <h2 style="color: #fff; font-size: 0.4in;margin: 10px 0 0 0; font-family: sans-serif;text-transform: uppercase;">` + i['id'] + `</h2>
                </td>
            </tr>
            <tr>
                <td><img src="profile-pic.jpg" alt="" style="max-width: 100%;margin: 0 auto;display: block;border-width: 5px;border-style: double;border-color: #333;box-shadow: 0 5px 10px rgba(0,0,0,0.3);"></td>
            </tr>
            <tr>
                <td>
                    <h5 style="margin:0; font-size: 0.32in;font-family: sans-serif;color: #000;">House Of Geeks</h5>
                    <h5  style="margin: 5px 0 0px; font-size: 0.16in;font-family: sans-serif;color: #000;">Technical Society</h5>
                    <h5  style="margin: 5px 0 0px; font-size: 0.16in;font-family: sans-serif;color: #000;">of</h5>
                    <h5  style="margin: 5px 0 40px; font-size: 0.16in;font-family: sans-serif;color: #000;">IIIT Ranchi</h5>
                </td>
            </tr>
            <tr>
                <td>
                   <img src="logo.png" alt="" style="max-width:100%;">
                </td>
            </tr>
            <tr>
                <td>
                    <h6 style="margin: 10px 0 10px; font-family: sans-serif;font-size: 0.16in;">Verification Link</h6>
                    <em>` +  verfiyLink + `</em>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>`};

        var options = { path: i['id'] + '.pdf', format: 'Tabloid' }
        await pdf.generatePdf(file, options).then(buf => {
            var fileBuffer = Buffer.from(buf);
            var bufArray = [{ name: i['id'] + '.pdf', mimetype: "text/html", file: fileBuffer }];
            var Certificate = require('../model/certificate');
            var model = new Certificate({
                uid: uid,
                file: bufArray
            });
            model.save();
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
                    await genTypeFour(req, res, sheet);
                    break;
            }
        }
    });
};

import PDFDocument from "pdfkit";

export const generatePDF = async (data) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: "A4",
            margin: 50,
            info: {
                Author: "SaaFlowAI",
                Title: data?.title,
                Creator: "SaaFlowAI"
            }
        })

        const chunks = []
        doc.on("data", (chunk) => chunks.push(chunk))
        doc.on("end", () => resolve(Buffer.concat(chunks)))
        doc.on("error", (err) => reject(err))

        doc
           .fontSize(28)
           .text(data.title, {
            align: "center"
           })
           .fillColor("#111827")   
           
        if (data.subtitle) {
            doc.moveDown(0.5)
        }
        //subtitle
        doc
           .fontSize(12)
           .text(data.subtitle, {
            align: "center"
           })
           .fillColor("#6B7280")        

        doc.moveDown(2)

        data?.sections?.forEach((s) =>{
            doc.fontSize(18)
               .fillColor("#111827")
               .text(s?.heading)

            doc.moveDown(0.5)

            s?.points?.forEach((p) => {
                doc
                .fontSize(12)
                .fillColor("#374151")
                .text(`• ${p}`, {
                    lineGap: 5
                })
            })

            doc.moveDown()
        })

        doc.moveDown()
        doc
           .fontSize(10)
           .fillColor("#111827")
           .text(`Created by SaaFlowAI`, { align: "center" })
        
        doc.end()
           
    })
}
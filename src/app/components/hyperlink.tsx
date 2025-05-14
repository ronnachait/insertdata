
export default function Hyperlink(id:string ,req:string ) {

    if(req === "file"){
        return `=hyperlink("https://drive.google.com/file/d/${id}", image("https://lh3.google.com/u/0/d/${id}", 4, 150, 150))`
    }else{
        return `=hyperlink("https://drive.google.com/file/d/${id}", "📁 Folder"`
    }
 
}

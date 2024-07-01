const fs = require('fs')
const process = require( 'process' )

const argv = key => {
  // Return true if the key exists and a value is undefined
  if ( process.argv.includes( `--${ key }` ) ) {
    return true
  }
  const value = process.argv.find(element => element.startsWith(`--${key}=`))
  // Return null if the key does not exist and a value is undefined
  if (!value) {
    return null
  }
  return value.replace( `--${ key }=` , '' )
}
let path = argv('path')
if (!path) {
  path = '.'
}
let outFile = argv('out')

const dir = fs.opendirSync(path)
let dirent
const content = {}
let i = 0
while ((dirent = dir.readSync()) !== null) {
  if (dirent.name.endsWith('.svg')) {
    content[dirent.name] = fs.readFileSync(dirent.path, 'utf8')
    i++
  }
}

dir.closeSync()

if (outFile) {
  fs.writeFileSync(outFile, JSON.stringify(content))
  console.log(`Found ${i} svg files in ${path}. File ${outFile} created`)
} else {
  console.log(content)
}



//const fileName = "myFile.txt";
//const fileData = fs.readFileSync(fileName, "utf8");
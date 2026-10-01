export default {
  content:["./index.html","./src/**/*.{js,jsx}"],
  darkMode:'class',
  theme:{
    extend:{
      fontFamily:{ sans:['Inter','system-ui','sans-serif'], display:['Playfair Display','Georgia','serif'] },
      colors:{
        primary:{ 50:'#f0fde8',100:'#dcfcc7',200:'#bbf7a0',300:'#86ef67',400:'#54B435',500:'#41a020',600:'#338016',700:'#276514',800:'#235112',900:'#1f4511',DEFAULT:'#54B435' },
        navy:{ 600:'#1e3a5f',700:'#162c48',800:'#0f1f35',900:'#0a1628',DEFAULT:'#1e3a5f' },
      },
    }
  },
  plugins:[]
}
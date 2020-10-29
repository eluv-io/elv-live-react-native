const theme = {
  "colors":{
    "blueVelvet": "#162252",
    "peafowl" : "#1D7CF2",
    "white" : "#fff"
  },
  "components":{
    "button":{
      "backgroundColor": "peafowl",
      "color": "white"
    }
  }
}

export const colorByComponent= (name, key) => {
  return theme.colors[theme.components[name][key]]
}


export default theme;
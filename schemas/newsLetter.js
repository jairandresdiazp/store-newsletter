/*
Entidad para guarda datos del news letter 
*/

fetch('/api/dataentities/NL/schemas/newsLetterV1', {
  "method": "PUT",
  headers: {
    "content-type": "application/json"
  },
  body: JSON.stringify({
    "title": "newsLetter",
    "type": "object",
    "properties": {
      "email": {
        "type": "string",
        "title": "email",
        "minLength": 3,
        "format": "email",
        "pattern": "^\\S+@\\S+\\.\\S+$"
      },
      "fields":{
        "type": "string",
        "title": "fields"
      },
    },
    "required": [
      "email"
    ],
    "v-security": {
      "allowGetAll": true,
      "publicWrite": [
        "email",
        "fields"
      ],
      "publicJsonSchema": true
    },
  }
  )
}).then(res => res.json()).then(res => console.log(res))

//print MDV1 https://user-images.githubusercontent.com/17678382/153898120-3aed4708-99b7-467a-8a37-87eb9666003c.png
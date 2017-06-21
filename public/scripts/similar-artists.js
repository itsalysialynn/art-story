// $(document).ready(function() {
//   var token =
//     "JvTPWe4WsQO-xqX6Bts49t1wUXNm6CD3gVT5CAkc58R25nZ353Lfyka2XDDjNTqqsoOgnSI8_ek5F-Q3KR3FKRkgll8NdJvUrkaICxLgL4n-4ZrdPVm0wLNqTIfX2GjKcMyOwg-aBR9HMJT-AFuwPDQTx6g4BK0hJGh5O91wH2w1MEB354TmT4kFkZ5p6AXQWveZYNdpr9oTXlk71cI5ZfUb-eQUmo7R9BApmxMBjaU=";
//   $("#first-result").click({
//     source: function(request, response) {
//       $.ajax({
//         url: "https://api.artsy.net/api/search?q=",
//         dataType: "json",
//         data: {
//           name: $("#first-result").val()
//         },
//         headers: {
//           "X-Xapp-Token": token
//         },
//         success: function(data) {
//           response(
//             $.map(data, function(item) {
//               return {
//                 label: `${} `,
//                 value:
//               };
//             })
//           );
//         }
//       });
//     },

// });
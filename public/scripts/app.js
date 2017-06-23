$(document).ready(function() {
  // API token
  var token =
    "JvTPWe4WsQO-xqX6Bts49t1wUXNm6CD3gVT5CAkc58R25nZ353Lfyka2XDDjNTqqsoOgnSI8_ek5F-Q3KR3FKRkgll8NdJvUrkaICxLgL4n-4ZrdPVm0wLNqTIfX2GjKcMyOwg-aBR9HMJT-AFuwPDQTx6g4BK0hJGh5O91wH2w1MEB354TmT4kFkZ5p6AXQWveZYNdpr9oTXlk71cI5ZfUb-eQUmo7R9BApmxMBjaU=";

  $(function() {
    $("#autocomplete").focus();
  });


  // submits search when enter is pressed
  $("#autocomplete").keypress(function(e) {
    if (e.which == 13) {
      $("form").submit();
      return false;
    }
  });

  //toggles the accordion on click
  $(".horizontal-accordion-item").click(function() {
    $(".horizontal-accordion-item").removeClass("active");

    $(this).addClass("active");
  });

  $(".horizontal-accordion-item-heading-rotated").click(function() {
    $(this).toggleClass(".horizontal-accordion-item-heading-click");
  });

  $(".vis-item-content").click(function() {
    $(".artist").fadeOut({
      duration: 300,
      done: function() {
        $(".artist").fadeIn(1000);
      }
    });
  });

  // queries API for search auto-fill data
  $("#autocomplete").autocomplete({
    source: function(request, response) {
      $.ajax({
        url: "https://api.artsy.net/api/v1/match?visible_to_public=true",
        dataType: "json",
        data: {
          term: request.term
        },
        headers: {
          "X-Xapp-Token": token
        },
        success: function(data) {
          response(
            data
              .filter(function(item) {
                return item.label === "Artist" || item.label === "Artwork";
              })
              .map(function(item) {
                return {
                  label: item.display,
                  value: item.id
                };
              })
          );
        }
      });
    },
    select: function(event, ui) {
      $("#autocomplete").val(ui.item.label);
      return false;
    }
  });

  $("#value").keypress(function(e) {});
});


function filterChamps() {
    var input = document.getElementById('searchInput');
    var filter = input.value.toUpperCase();
    var cards = document.getElementsByClassName('champ-card');

    for (i = 0; i < cards.length; i++) {
        var name = cards[i].getAttribute('data-name');
        if (name.toUpperCase().indexOf(filter) > -1) {
            cards[i].style.display = "";
        } else {
            cards[i].style.display = "none";
        }
    }
}
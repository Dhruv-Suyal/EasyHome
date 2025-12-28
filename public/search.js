document.addEventListener("DOMContentLoaded", ()=>{
        const suggestionsBox = document.getElementById('suggestionsBox');
        const input = document.getElementById('searchInput');
        if(!input || !suggestionsBox) return;

        input.addEventListener('keyup', async ()=>{
            const q = input.value.trim();
            if(q.length<1){
                suggestionsBox.classList.add("hidden");
                return;
            }
            const res = await fetch(`/autoComplete?q=${q}`);
            const data = await res.json();
            showSuggestions(data);
            console.log(data);
        })

        function showSuggestions(data){
            if(!data || data.length=== 0){
                suggestionsBox.classList.add("hidden");
                return;
            }
            suggestionsBox.innerHTML = data.map(item=>
            `<div class ="cursor-pointer p-4 hover:bg-white/30 text-white" onclick="clickSuggestion('${item.label}')">
                ${item.label}
            </div>`
            ).join("");

            suggestionsBox.classList.remove("hidden");
        }

        window.clickSuggestion = function(label){
            input.value = label;
            suggestionsBox.classList.add("hidden");

            input.focus();
            input.setSelectionRange(label.length, label.length);
        }

        document.addEventListener("click", e=>{
            if(!e.target.closest(".search-bar")){
                suggestionsBox.classList.add("hidden");
            }
        })
            
})
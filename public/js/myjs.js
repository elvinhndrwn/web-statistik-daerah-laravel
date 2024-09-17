var apiKey = "519fbdfe07dddde829aa7376bb2e985b";
document.addEventListener("DOMContentLoaded", function () {
    $("#subjek").select2({
        placeholder: "Select an option",
        allowClear: true,
    });

    $("#indikator").select2({
        placeholder: "Pilih Indikator",
        allowClear: true,
    });

    $("#subjek").change(function () {
        $('#subjek option[value=""]').prop("disabled", true);
        var subjekId = $(this).val(); // Ambil nilai subjek yang dipilih

        var turvarContainer = document.getElementById('turvar-container');
        turvarContainer.style.display = 'none';

        if (subjekId) {
            // Memanggil API untuk mendapatkan indikator
            fetchIndicators(subjekId);
        } else {
            // Jika tidak ada subjek yang dipilih, kosongkan dropdown indikator
            $("#indikator")
                .empty()
                .append('<option value="">Pilih Indikator</option>')
                .trigger("change");
        }
    });
});

function fetchIndicators(subjekId) {
    var page = 1;
    var totalPages = 1;
    var allData = [];

    function fetchPage(page) {
        $.ajax({
            url: `https://webapi.bps.go.id/v1/api/list?model=var&domain=3402&key=${apiKey}&subject=${subjekId}&page=${page}`,
            method: "GET",
            success: function (response) {
                var data = response.data[1];
                allData = allData.concat(data); // Gabungkan data
                totalPages = response.data[0].pages; // Ambil total halaman

                if (page < totalPages) {
                    fetchPage(page + 1); // Ambil halaman berikutnya
                } else {
                    updateDropdown();
                }
            },
            error: function (xhr) {
                console.error("Failed to fetch indicators:", xhr);
            },
        });
    }

    function updateDropdown() {
        var $indikator = $("#indikator");
        $indikator.empty();
        $indikator.append('<option value="">Pilih Indikator</option>');

        $.each(allData, function (index, item) {
            $indikator.append(
                $("<option></option>").val(item.var_id).text(item.title)
            );
        });

        $indikator.trigger("change"); // Trigger change event for Select2
    }

    fetchPage(page);
}

$("#indikator").change(function () {
    var indikatorId = $(this).val(); // Ambil nilai indikator yang dipilih

    if (indikatorId) {
        // Memanggil API untuk mendapatkan detail data
        fetchDetailData(indikatorId);
    }
});

function fetchDetailData(indikatorId) {
    var domain = 3402; // Gantilah sesuai dengan domain yang digunakan
    var th = 123; // Tahun, sesuaikan dengan yang diperlukan
    var turth = 0; // Parameter tambahan, sesuaikan dengan yang diperlukan

    $.ajax({
        url: `https://webapi.bps.go.id/v1/api/list/?key=${apiKey}&model=data&domain=${domain}&var=${indikatorId}&th=${th}&turth=${turth}`,
        method: "GET",
        success: function (response) {
            console.log("Detail Data:", response); // Log detail data ke console

            if (response.data !== "") {
                if (response.turvar && response.turvar.length > 0 && response.turvar[0].val !== 0) {
                        var turvarContainer = document.getElementById('turvar-container');

                        // Buat elemen select untuk dropdown
                        var dropdown =
                            `<label for="turvar" class="form-label">Karakteristik</label> 
                            <select class="form-select" id="turvar-dropdown">`;

                        // Tambahkan options ke dalam dropdown
                        response.turvar.forEach(function (item) {
                            dropdown +=
                                '<option value="' +
                                item.val +
                                '">' +
                                item.label +
                                "</option>";
                        });

                        dropdown += "</select>";

                        // Tempatkan dropdown ke dalam elemen tertentu di halaman
                        turvarContainer.innerHTML = dropdown;
                        turvarContainer.style.display = "block"; // Show the container
                    
                } else {
                    renderTable(response);
                }
            } else {
                $("#resultTable").hide();
                iziToast.error({
                    title: "Error",
                    position: "center",
                    overlay: true,
                    message: "Tidak ada data yang ditemukan.",
                });
            }
        },
        error: function (xhr) {
            console.error("Failed to fetch detail data:", xhr);
        },
    });
}

function renderTable(response) {
    var vervar = response.vervar;
    var datacontent = response.datacontent;
    var datacontentValues = Object.values(datacontent);
    var detail = response.var[0];
    var labelVervar = response.labelvervar;

    // Menggabungkan vervar dan datacontent dalam satu array objek
    var tableData = vervar.map((item, index) => {
        return {
            label: item.label,
            jumlah: datacontentValues[index],
        };
    });

    // Mengurutkan data berdasarkan label (nama kecamatan)
    // tableData.sort((a, b) => a.label.localeCompare(b.label));

    var tableHtml = `
                        <table class="table table-hover table-bordered">
                        <caption class="text-sm fst-italic fw-bold">${detail.note}</caption>
                            <thead class="table-dark">
                                <tr>
                                    <th>${labelVervar}</th>
                                    <th>Jumlah</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;

    tableData.forEach(function (item) {
        tableHtml += `
                            <tr>
                                <td>${item.label}</td>
                                <td>${item.jumlah}</td>
                            </tr>
                        `;
    });

    tableHtml += `
                            </tbody>
                        </table>
                    `;

    $("#resultTable").html(tableHtml).show();
}

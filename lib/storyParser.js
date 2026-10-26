/**
 * Story Parser - Bóc tách định dạng câu chuyện chuẩn === STORY ===
 */

function parseStories(rawText) {
  if (!rawText || !rawText.trim()) return [];

  const rawBlocks = rawText.split(/(?:^|\n)===\s*STORY\s*[\w\d]*\s*===/i);
  const stories = [];

  for (let block of rawBlocks) {
    const text = block.trim();
    if (!text) continue;

    const lines = text.split("\n");
    let author = "";
    let timeAgo = "Il y a 2 h";
    let pageName = "";
    let title = "";
    let content = "";
    let highlights = [];
    let cta = "Continuer la lecture dans les commentaires";
    let caption = "";
    let comment1 = "";

    let isCollectingContent = false;
    let contentLines = [];

    for (let line of lines) {
      const trimmed = line.trim();

      if (/^Tác giả\s*:\s*/i.test(trimmed)) {
        author = trimmed.replace(/^Tác giả\s*:\s*/i, "").trim();
        isCollectingContent = false;
      } else if (/^Thời gian\s*:\s*/i.test(trimmed)) {
        timeAgo = trimmed.replace(/^Thời gian\s*:\s*/i, "").trim();
        isCollectingContent = false;
      } else if (/^Tên Page\s*:\s*/i.test(trimmed)) {
        pageName = trimmed.replace(/^Tên Page\s*:\s*/i, "").trim();
        isCollectingContent = false;
      } else if (/^Tiêu đề\s*:\s*/i.test(trimmed)) {
        title = trimmed.replace(/^Tiêu đề\s*:\s*/i, "").trim();
        isCollectingContent = false;
      } else if (/^Nội dung thẻ\s*:\s*/i.test(trimmed)) {
        isCollectingContent = true;
      } else if (/^Highlights\s*:\s*/i.test(trimmed)) {
        isCollectingContent = false;
        const hlStr = trimmed.replace(/^Highlights\s*:\s*/i, "").trim();
        highlights = hlStr
          .split("|")
          .map((h) => h.replace(/^["'«]+|["'»]+$/g, "").trim())
          .filter(Boolean);
      } else if (/^Nút CTA\s*:\s*/i.test(trimmed)) {
        isCollectingContent = false;
        cta = trimmed.replace(/^Nút CTA\s*:\s*/i, "").trim();
      } else if (/^Caption\s*:\s*/i.test(trimmed)) {
        isCollectingContent = false;
        caption = trimmed.replace(/^Caption\s*:\s*/i, "").trim();
      } else if (/^Comment 1\s*:\s*/i.test(trimmed)) {
        isCollectingContent = false;
        comment1 = trimmed.replace(/^Comment 1\s*:\s*/i, "").trim();
      } else if (isCollectingContent) {
        if (trimmed) contentLines.push(trimmed);
      } else if (comment1) {
        // Collect multi-line comment 1
        comment1 += "\n" + line;
      }
    }

    content = contentLines.join("\n");

    // Fallback nếu không có cấu trúc chuẩn dòng
    if (!content && text) {
      const normalLines = lines.filter((l) => l.trim().length > 0);
      content = normalLines.slice(0, 5).join("\n");
      author = author || "Maja Nowak";
      title = title || "Câu chuyện ngắn";
      caption = caption || content.slice(0, 100) + "...\n👇 Đọc tiếp dưới bình luận";
      comment1 = comment1 || "PARTIE 2:\nNội dung tiếp theo tại website.";
    }

    stories.push({
      id: "story_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
      index: stories.length + 1,
      author: author || "Maja Nowak",
      timeAgo: timeAgo || "3 godz. temu",
      pageName: pageName || "The Story Studio",
      title: title || "Chuyện đời thường",
      content: content || "Nội dung câu chuyện chưa được nhập...",
      highlights: highlights.length > 0 ? highlights : [],
      cta: cta || "Czytaj dalej",
      caption: caption || "Bấm xem tiếp phần kết dưới bình luận... 👇",
      comment1: comment1 || "PARTIE 2: Xem toàn bộ chi tiết tại website của chúng tôi!"
    });
  }

  return stories;
}

const SAMPLE_STORIES = `=== STORY 1 ===
Tác giả: Maja Nowak
Thời gian: 3 godz. temu
Tên Page: Cienie Spadku
Tiêu đề: Di chúc của mẹ
Nội dung thẻ:
Ngày thứ tư sau ca mổ, mẹ chồng đặt trước mặt tôi tập giấy.
Con gái tôi nằm lồng kính tầng ba, sinh non tuần ba mươi hai.
Tôi mới nhìn con đúng bốn mươi giây thì họ đẩy tôi đi.
Bà vào lúc chín giờ hai mươi, không gõ cửa. "Ký mấy cái này, thủ tục cho con bé thôi."
Tôi lật trang đầu. Không phải giấy khai sinh. Bên được ủy quyền: mẹ chồng tôi. Ba tiếng sau, một điều dưỡng lạ đặt lên bàn tôi chiếc phong bì ố vàng, viết bằng nét chữ của mẹ tôi...
Highlights: "Ký mấy cái này, thủ tục cho con bé thôi" | "Bên được ủy quyền: mẹ chồng tôi" | "nét chữ của mẹ tôi"
Nút CTA: Czytaj dalej
Caption: Bà muốn tôi ký giấy từ bỏ quyền nuôi con khi tôi vừa tỉnh dậy. Nhưng chiếc phong bì ố vàng đã lật tẩy tất cả... 👇 #truyenngan #giadinh #dramabaLan
Comment 1: PARTIE 2:
Chiếc phong bì đó là bức thư tay mẹ tôi gửi trước khi qua đời ba năm trước. Trong thư, mẹ dặn rõ về căn nhà và số tiền tiết kiệm trị giá 2 tỷ đồng mà mẹ chồng tôi đã giấu kín suốt thời gian qua.
👉 Đọc trọn bộ phần 3 tại: https://thestorypress.online

=== STORY 2 ===
Tác giả: Brigitte Lefèvre
Thời gian: Il y a 2 h
Tên Page: Closed Doors
Tiêu đề: Ngôi nhà của bà ngoại
Nội dung thẻ:
Après vingt-huit ans de mariage à Lyon, mon mari a posé mes valises sur le trottoir sous la pluie.
« Tu n'as jamais rien payé dans cette maison, Brigitte, signe ces papiers et dégage ! »
J'ai élevé ses trois enfants, soigné sa mère malade et renoncé à mon poste d'enseignante pour lui.
Sa maîtresse attendait déjà dans la voiture, pendant que je sortais calmement une copie de l'acte notarié.
Il a ri en voyant le document, sans savoir qu'une seule ligne, page quatre, allait tout changer...
Highlights: "Tu n'as jamais rien payé dans cette maison" | "renoncé à mon poste d'enseignante pour lui" | "une seule ligne, page quatre"
Nút CTA: Continuer la lecture dans les commentaires
Caption: Il voulait installer sa maîtresse chez moi. Il avait oublié une ligne chez le notaire… 👇 #closeddoors #divorce #notaire
Comment 1: PARTIE 2:
Page quatre, il y avait la clause de remploi : quatre-vingt-dix pour cent du prix payés avec des fonds propres hérités de Madame Odette Marchand. La maison était à moi !
👉 Lire la suite sur https://thestorypress.online/fr

=== STORY 3 ===
Tác giả: Anouk van Dijk
Thời gian: 2 uur geleden
Tên Page: Verborgen Waarheden
Tiêu đề: Bức thư trong két sắt
Nội dung thẻ:
Op de dag van de crematie van mijn vader vroeg mijn stiefmoeder direct om de kluissleutels.
"Je vader heeft alles aan mij nagelaten, jij hebt hier niets meer te zoeken."
Tien jaar lang zorgde ik dag en nacht voor hem terwijl zij op vakantie was in Spanje.
Ik glimlachte, opende de kluis en haalde een blauwe map tevoorschijn die ze nog nooit had gezien.
Haar gezicht werd lijkbleek toen de notaris de verzegelde brief voorlas...
Highlights: "jij hebt hier niets meer te zoeken" | "Tien jaar lang zorgde ik dag en nacht" | "Haar gezicht werd lijkbleek"
Nút CTA: Lees verder in de reacties
Caption: Ze dacht dat ze alles zou erven na tien jaar afwezigheid. Maar mijn vader had alles voorbereid… 👇 #erfenis #familie #drama
Comment 1: DEEL 2:
In de verzegelde brief stond dat het huis en het familiebedrijf rechtstreeks naar mij gingen, op voorwaarde dat ik het testament pas op de dag van de uitvaart zou openen.
👉 Lees het volledige verhaal op https://thestorypress.online/nl

=== STORY 4 ===
Tác giả: Sarah Jenkins
Thời gian: 4 hours ago
Tên Page: Behind Estate Gates
Tiêu đề: The Secret Trust
Nội dung thẻ:
At the reading of my grandfather's will, my uncle smirked across the oak table.
"A secretary's daughter inherits nothing from an oil tycoon, Sarah."
I had spent five years running the estate while he gambled away his allowances in Monaco.
The lawyer cleared his throat, opened a red leather folder, and placed a voice recorder on the desk.
The room went dead silent as my grandfather's voice filled the mahogany library...
Highlights: "inherits nothing from an oil tycoon" | "running the estate while he gambled" | "The room went dead silent"
Nút CTA: Continue reading in comments
Caption: He thought bloodline was everything. But grandfather recorded his final meeting alone… 👇 #inheritance #familydrama #betrayal
Comment 1: PART 2:
"If you are hearing this recording, it means Richard has tried to contest my wishes. Everything in trust fund B belongs solely to Sarah."
👉 Read the full story on https://thestorypress.online/en

=== STORY 5 ===
Tác giả: Clara Hartmann
Thời gian: vor 3 Stunden
Tên Page: Verborgene Vermächtnisse
Tiêu đề: Das Testament von Hamburg
Nội dung thẻ:
Nach dreißig Jahren treuer Arbeit in der Kanzlei sagte mein Chef mir am Freitag die Kündigung zu.
"Du bist zu alt für die moderne Rechtsberatung, Clara, nimm die Abfindung und geh."
Ich packte meine Sachen schweigend und nahm die alte Akte mit dem Wachssiegel aus meinem Safe.
Er lachte höhnisch, bis er sah, wessen Name auf dem Originalvertrag der Kanzleigründung stand.
Sein Lächeln gefror im selben Moment...
Highlights: "Du bist zu alt für die moderne Rechtsberatung" | "alte Akte mit dem Wachssiegel" | "Sein Lächeln gefror im selben Moment"
Nút CTA: Weiterlesen in den Kommentaren
Caption: Er wollte mich loswerden, nachdem ich die Kanzlei aufgebaut hatte. Er hatte den Vertrag von 1994 vergessen… 👇 #kanzlei #rache #drama
Comment 1: TEIL 2:
Der Vertrag bewies, dass 51 Prozent der Firmenanteile meiner Familie gehörten. Er war nicht der Eigentümer, sondern nur ein angestellter Geschäftsführer!
👉 Ganze Geschichte lesen auf https://thestorypress.online/de`;

module.exports = {
  parseStories,
  SAMPLE_STORIES
};

import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_presentation():
    prs = Presentation()
    
    # Set slide dimensions to widescreen 16:9
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    
    # Define colors
    bg_color = RGBColor(5, 5, 5)        # Pure pitch black
    text_white = RGBColor(250, 250, 250)
    text_gray = RGBColor(161, 161, 161)
    cyan = RGBColor(80, 227, 194)       # #50E3C2
    emerald = RGBColor(16, 185, 129)    # #10B981
    accent_purple = RGBColor(121, 40, 202) # #7928CA
    card_bg = RGBColor(18, 18, 18)     # Soft dark grey for cards
    border_color = RGBColor(38, 38, 38) # Gray border
    
    def apply_dark_bg(slide):
        # Embed looping animated shader GIF as slide background
        bg_pic = slide.shapes.add_picture(
            "/home/rv/Desktop/Projects/Work/8th/LogStrata/shader_bg.gif",
            0, 0, prs.slide_width, prs.slide_height
        )
        # Inject XML elements for an elegant slow Fade transition
        from pptx.oxml import parse_xml
        transition_xml = parse_xml(
            '<p:transition xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" speed="slow"><p:fade/></p:transition>'
        )
        slide._element.append(transition_xml)
        return bg_pic

    def add_title(slide, text, color=text_white):
        tx_box = slide.shapes.add_textbox(Inches(0.75), Inches(0.5), Inches(11.8), Inches(1))
        tf = tx_box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = text
        p.font.name = 'Inter'
        p.font.size = Pt(38)
        p.font.bold = True
        p.font.color.rgb = color
        return tx_box

    # --- Slide 1: Title Slide ---
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    apply_dark_bg(slide)
    
    # Large Title text box
    title_box = slide.shapes.add_textbox(Inches(0.75), Inches(2.2), Inches(11.8), Inches(4.5))
    tf = title_box.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
    
    p = tf.paragraphs[0]
    p.text = "LOGSTRATA"
    p.font.name = 'Inter'
    p.font.size = Pt(64)
    p.font.bold = True
    p.font.color.rgb = cyan
    
    p2 = tf.add_paragraph()
    p2.text = "Security-Aware Log-Driven Kubernetes Autoscaling"
    p2.font.name = 'Inter'
    p2.font.size = Pt(26)
    p2.font.bold = False
    p2.font.color.rgb = text_white
    p2.space_before = Pt(15)
    
    p3 = tf.add_paragraph()
    p3.text = "Real-time access log ingestion for predictive scaling and threat-preemptive cluster defense"
    p3.font.name = 'Inter'
    p3.font.size = Pt(16)
    p3.font.color.rgb = text_gray
    p3.space_before = Pt(30)
    
    # --- Slide 2: The Problem: CPU Metric Lag ---
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    apply_dark_bg(slide)
    add_title(slide, "The Problem: CPU/Memory Metric Lag")
    
    # Left Card: Traditional CPU Scaling
    card1 = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.75), Inches(1.8), Inches(5.6), Inches(4.8))
    card1.fill.solid()
    card1.fill.fore_color.rgb = card_bg
    card1.line.color.rgb = border_color
    
    tf1 = card1.text_frame
    tf1.word_wrap = True
    tf1.margin_left = tf1.margin_right = tf1.margin_top = Inches(0.4)
    p = tf1.paragraphs[0]
    p.text = "Traditional HPA (Metrics Polling)"
    p.font.name = 'Inter'
    p.font.size = Pt(20)
    p.font.bold = True
    p.font.color.rgb = text_white
    
    points1 = [
        "Metrics Server polls CPU every 60 seconds",
        "Average utilization calculation hides sudden spikes",
        "Containers crash-loop before scaling is triggered",
        "Result: Extreme latency and 504 Gateway Timeout failures"
    ]
    for pt in points1:
        p_pt = tf1.add_paragraph()
        p_pt.text = "• " + pt
        p_pt.font.name = 'Inter'
        p_pt.font.size = Pt(14)
        p_pt.font.color.rgb = text_gray
        p_pt.space_before = Pt(15)
        
    # Right Card: Impact during Spikes
    card2 = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.98), Inches(1.8), Inches(5.6), Inches(4.8))
    card2.fill.solid()
    card2.fill.fore_color.rgb = card_bg
    card2.line.color.rgb = border_color
    
    tf2 = card2.text_frame
    tf2.word_wrap = True
    tf2.margin_left = tf2.margin_right = tf2.margin_top = Inches(0.4)
    p = tf2.paragraphs[0]
    p.text = "Autoscaling during DDoS & Flash Sales"
    p.font.name = 'Inter'
    p.font.size = Pt(20)
    p.font.bold = True
    p.font.color.rgb = RGBColor(239, 68, 68) # Red alert
    
    points2 = [
        "DDoS attacks deplete bandwidth and connection threads",
        "Resource depletion triggers scaling on bad traffic",
        "Standard autoscaler scales out pods, spending cloud budget on attackers",
        "Result: Budget abuse, node saturation, and complete service failure"
    ]
    for pt in points2:
        p_pt = tf2.add_paragraph()
        p_pt.text = "• " + pt
        p_pt.font.name = 'Inter'
        p_pt.font.size = Pt(14)
        p_pt.font.color.rgb = text_gray
        p_pt.space_before = Pt(15)

    # --- Slide 3: The Solution: Log-Driven Scaling ---
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    apply_dark_bg(slide)
    add_title(slide, "The Solution: Log-Driven Scaling")
    
    # Full Width Concept Card
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.75), Inches(1.8), Inches(11.83), Inches(4.8))
    card.fill.solid()
    card.fill.fore_color.rgb = card_bg
    card.line.color.rgb = border_color
    
    tf = card.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = Inches(0.4)
    p = tf.paragraphs[0]
    p.text = "Predictive Pre-emption with LogStrata"
    p.font.name = 'Inter'
    p.font.size = Pt(22)
    p.font.bold = True
    p.font.color.rgb = emerald
    
    bullets = [
        "Real-Time Log Ingestion: Tacks stdout stream via containerd socket logs directly.",
        "Predictive Logic: Analyzes application level logs (/checkout, /api status) to scale pods before CPU load moves.",
        "Security Co-processing: Detects brute force or scanning signatures within access logs instantly.",
        "Adaptive Ingress Rules: Updates Nginx Ingress policies to throttle/block attack IPs and maintain legitimate access.",
        "Cooldown Windows: Safe cooldown scaling timer patterns to prevent replica thrashing."
    ]
    for b in bullets:
        p_b = tf.add_paragraph()
        p_b.text = "✓ " + b.split(":")[0] + ":" + b.split(":")[1]
        p_b.font.name = 'Inter'
        p_b.font.size = Pt(15)
        p_b.font.color.rgb = text_white
        p_b.space_before = Pt(12)
        # Bold the title part
        p_b.runs[0].font.bold = True
        p_b.runs[0].font.color.rgb = cyan

    # --- Slide 4: System Architecture ---
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    apply_dark_bg(slide)
    add_title(slide, "System Architecture & Data Flow")
    
    # 4 stages layout
    stages = [
        ("1. COLLECT", "Fluentd DaemonSet", "Tails container log sockets directly from cluster nodes, indexing fields on-the-fly."),
        ("2. FILTER", "Elasticsearch Ingestion", "Indices logs in structured templates; evaluates query traffic spikes and rates."),
        ("3. DECIDE", "LogStrata Daemon", "Evaluates LogAutoscalerPolicy CRD settings and calculates desired replicas."),
        ("4. ACT", "Kubernetes Controller", "Triggers replica scaling and updates Nginx ConfigMap blocklists within 50ms.")
    ]
    
    width = Inches(2.7)
    height = Inches(4.5)
    top = Inches(2.0)
    spacing = Inches(0.3)
    
    for idx, (stage_title, subtitle, desc) in enumerate(stages):
        left = Inches(0.75) + idx * (width + spacing)
        box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        box.fill.solid()
        box.fill.fore_color.rgb = card_bg
        box.line.color.rgb = border_color
        
        tf = box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = Inches(0.3)
        
        p = tf.paragraphs[0]
        p.text = stage_title
        p.font.name = 'Inter'
        p.font.size = Pt(18)
        p.font.bold = True
        p.font.color.rgb = cyan
        
        p2 = tf.add_paragraph()
        p2.text = subtitle
        p2.font.name = 'Inter'
        p2.font.size = Pt(13)
        p2.font.bold = True
        p2.font.color.rgb = text_white
        p2.space_before = Pt(10)
        
        p3 = tf.add_paragraph()
        p3.text = desc
        p3.font.name = 'Inter'
        p3.font.size = Pt(12)
        p3.font.color.rgb = text_gray
        p3.space_before = Pt(15)

    # --- Slide 5: Scaling Formula & CRD Configuration ---
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    apply_dark_bg(slide)
    add_title(slide, "Autoscaling Logic & Custom Resources")
    
    # Left Card: Formula
    card_l = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.75), Inches(1.8), Inches(5.6), Inches(4.8))
    card_l.fill.solid()
    card_l.fill.fore_color.rgb = card_bg
    card_l.line.color.rgb = border_color
    
    tf_l = card_l.text_frame
    tf_l.word_wrap = True
    tf_l.margin_left = tf_l.margin_right = tf_l.margin_top = Inches(0.4)
    
    p = tf_l.paragraphs[0]
    p.text = "Scaling Calculation Model"
    p.font.name = 'Inter'
    p.font.size = Pt(20)
    p.font.bold = True
    p.font.color.rgb = text_white
    
    p2 = tf_l.add_paragraph()
    p2.text = "DesiredReplicas = ceil( CurrentReplicas * ( CurrentMetric / TargetThreshold ) )"
    p2.font.name = 'Courier New'
    p2.font.size = Pt(13)
    p2.font.bold = True
    p2.font.color.rgb = cyan
    p2.space_before = Pt(25)
    
    bullets_formula = [
        "Triggered directly by application-level requests per second (RPS).",
        "Uses P95/P99 latency percentile goals to calculate bounds.",
        "Ignores noise from bad requests (e.g. 404 or 401 scans).",
        "Aggregates metrics directly from raw server access log feeds."
    ]
    for b in bullets_formula:
        p_b = tf_l.add_paragraph()
        p_b.text = "• " + b
        p_b.font.name = 'Inter'
        p_b.font.size = Pt(13)
        p_b.font.color.rgb = text_gray
        p_b.space_before = Pt(15)

    # Right Card: CRD Manifest Example
    card_r = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.98), Inches(1.8), Inches(5.6), Inches(4.8))
    card_r.fill.solid()
    card_r.fill.fore_color.rgb = card_bg
    card_r.line.color.rgb = border_color
    
    tf_r = card_r.text_frame
    tf_r.word_wrap = True
    tf_r.margin_left = tf_r.margin_right = tf_r.margin_top = Inches(0.3)
    
    p = tf_r.paragraphs[0]
    p.text = "LogAutoscalerPolicy CRD"
    p.font.name = 'Inter'
    p.font.size = Pt(20)
    p.font.bold = True
    p.font.color.rgb = text_white
    
    yaml_lines = [
        "apiVersion: core.logstrata.io/v1alpha1",
        "kind: LogAutoscalerPolicy",
        "spec:",
        "  scaleTargetRef:",
        "    kind: Deployment",
        "    name: commerce-frontend",
        "  metricSources:",
        "    - type: ElasticSearchQuery",
        "      elasticsearch:",
        "        query: 'status:200 AND path:/checkout'",
        "        trigger:",
        "          metricName: throughput_rps",
        "          threshold: 450.0",
        "  minReplicas: 3",
        "  maxReplicas: 25"
    ]
    
    p_code = tf_r.add_paragraph()
    p_code.text = "\n".join(yaml_lines)
    p_code.font.name = 'Courier New'
    p_code.font.size = Pt(10)
    p_code.font.color.rgb = text_gray
    p_code.space_before = Pt(15)

    # --- Slide 6: Security & Ingress Threat Shield ---
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    apply_dark_bg(slide)
    add_title(slide, "Security & Ingress Threat Shield")
    
    card_s = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.75), Inches(1.8), Inches(11.83), Inches(4.8))
    card_s.fill.solid()
    card_s.fill.fore_color.rgb = card_bg
    card_s.line.color.rgb = border_color
    
    tf_s = card_s.text_frame
    tf_s.word_wrap = True
    tf_s.margin_left = tf_s.margin_right = tf_s.margin_top = Inches(0.4)
    
    p = tf_s.paragraphs[0]
    p.text = "Anti-DDoS and Brute Force Pre-emption"
    p.font.name = 'Inter'
    p.font.size = Pt(22)
    p.font.bold = True
    p.font.color.rgb = RGBColor(245, 166, 35) # Orange accent
    
    sec_points = [
        "Real-Time Signature Analysis: LogStrata analyzes ingress logs for patterns of high-velocity brute-force scanning (e.g. repeated 401/403/404 errors).",
        "Zero-Trust Auto-Blocklist: Malicious IPs are auto-assigned a block lease term and added to the cluster's active blocklist.",
        "Ingress Policy Enforcement: The controller patches the Nginx Ingress ConfigMap in real-time, blocking threats at the network edge before pods are overloaded.",
        "SIEM Compliance Logs: Block events and audit logs are shipped to Elasticsearch for compliance auditing and analytics reporting."
    ]
    for pt in sec_points:
        p_pt = tf_s.add_paragraph()
        p_pt.text = "🛡️ " + pt.split(":")[0] + ":" + pt.split(":")[1]
        p_pt.font.name = 'Inter'
        p_pt.font.size = Pt(14)
        p_pt.font.color.rgb = text_white
        p_pt.space_before = Pt(15)
        # Bold title
        p_pt.runs[0].font.bold = True
        p_pt.runs[0].font.color.rgb = cyan

    # --- Slide 7: Interactive Chaos Playground ---
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    apply_dark_bg(slide)
    add_title(slide, "Real-Time DevSecOps Playground")
    
    # 3 Stat Cards
    stats_data = [
        ("< 50ms", "DECISION LOOP", "Telemetry logs collection, query analysis, and ingress patching completes under 50ms."),
        ("5", "PROVIDER TYPES", "Supported environments: AWS EKS, Google GKE, Azure AKS, Minikube, and Custom Clusters."),
        ("Active", "SIMULATION LAB", "Includes built-in traffic generation sliders, pod chaos injector, and live autoscaling graphs.")
    ]
    
    w_stat = Inches(3.7)
    h_stat = Inches(4.5)
    t_stat = Inches(2.0)
    sp_stat = Inches(0.4)
    
    for idx, (val, label, details) in enumerate(stats_data):
        l_stat = Inches(0.75) + idx * (w_stat + sp_stat)
        box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, l_stat, t_stat, w_stat, h_stat)
        box.fill.solid()
        box.fill.fore_color.rgb = card_bg
        box.line.color.rgb = border_color
        
        tf = box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = Inches(0.4)
        
        p = tf.paragraphs[0]
        p.text = val
        p.font.name = 'Inter'
        p.font.size = Pt(36)
        p.font.bold = True
        p.font.color.rgb = emerald if val != "< 50ms" else cyan
        
        p2 = tf.add_paragraph()
        p2.text = label
        p2.font.name = 'Inter'
        p2.font.size = Pt(14)
        p2.font.bold = True
        p2.font.color.rgb = text_white
        p2.space_before = Pt(10)
        
        p3 = tf.add_paragraph()
        p3.text = details
        p3.font.name = 'Inter'
        p3.font.size = Pt(13)
        p3.font.color.rgb = text_gray
        p3.space_before = Pt(20)

    # --- Slide 8: Deployment & Conclusion ---
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    apply_dark_bg(slide)
    add_title(slide, "Conclusion & Getting Started")
    
    card_c = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.75), Inches(1.8), Inches(11.83), Inches(4.8))
    card_c.fill.solid()
    card_c.fill.fore_color.rgb = card_bg
    card_c.line.color.rgb = border_color
    
    tf_c = card_c.text_frame
    tf_c.word_wrap = True
    tf_c.margin_left = tf_c.margin_right = tf_c.margin_top = Inches(0.4)
    
    p = tf_c.paragraphs[0]
    p.text = "Deploying LogStrata to Production"
    p.font.name = 'Inter'
    p.font.size = Pt(22)
    p.font.bold = True
    p.font.color.rgb = text_white
    
    p_step1 = tf_c.add_paragraph()
    p_step1.text = "1. Add Helm Repository & Update"
    p_step1.font.name = 'Inter'
    p_step1.font.size = Pt(15)
    p_step1.font.bold = True
    p_step1.font.color.rgb = cyan
    p_step1.space_before = Pt(15)
    
    p_code1 = tf_c.add_paragraph()
    p_code1.text = "$ helm repo add logstrata https://helm.logstrata.io && helm repo update"
    p_code1.font.name = 'Courier New'
    p_code1.font.size = Pt(12)
    p_code1.font.color.rgb = text_gray
    p_code1.space_before = Pt(5)
    
    p_step2 = tf_c.add_paragraph()
    p_step2.text = "2. Deploy Agent Namespace & Collectors"
    p_step2.font.name = 'Inter'
    p_step2.font.size = Pt(15)
    p_step2.font.bold = True
    p_step2.font.color.rgb = cyan
    p_step2.space_before = Pt(15)
    
    p_code2 = tf_c.add_paragraph()
    p_code2.text = "$ helm install logstrata logstrata/logstrata --namespace logstrata-system --create-namespace"
    p_code2.font.name = 'Courier New'
    p_code2.font.size = Pt(12)
    p_code2.font.color.rgb = text_gray
    p_code2.space_before = Pt(5)
    
    p_conc = tf_c.add_paragraph()
    p_conc.text = "Summary: LogStrata transforms Kubernetes autoscaling from a slow reactive resource utilization model into an intelligent, secure, log-first transaction rate model, maintaining cluster responsiveness during intense traffic shifts."
    p_conc.font.name = 'Inter'
    p_conc.font.size = Pt(13)
    p_conc.font.color.rgb = text_white
    p_conc.space_before = Pt(30)
    p_conc.runs[0].font.italic = True

    # Save presentation
    output_path = "/home/rv/Desktop/Projects/Work/8th/LogStrata/LogStrata_Presentation.pptx"
    prs.save(output_path)
    print(f"Presentation saved to: {output_path}")

if __name__ == '__main__':
    create_presentation()

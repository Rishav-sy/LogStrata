# LogStrata Project Reference Index

The following references and resources were consulted during the design, development, and documentation of the **LogStrata** Security-Aware Auto Log Scaling & Analytics system:

1. **Kubernetes API Reference – HorizontalPodAutoscaler (HPA)**. Official documentation detailing scaling behaviors, target metrics (CPU, memory, custom metrics), scaling stabilization windows, and cooldown mechanisms. [https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/horizontal-pod-autoscaler-v2/](https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/horizontal-pod-autoscaler-v2/)

2. **Kubernetes Custom Resource Definitions (CRDs)**. Technical guide for extending the Kubernetes API with custom resources, detailing validation schemas, subresources, and API versioning. [https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/)

3. **Fluentd Official Documentation – Fluentd log aggregation**. Consulted for configuration schemas, regex parsing, buffering strategies, and security-aware log routing. [https://docs.fluentd.org](https://docs.fluentd.org)

4. **Elasticsearch Reference Guide – Lucene Query Syntax**. Used for constructing structured query expressions, filtering, search index templates, and log lifecycle management (ILM). [https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)

5. **Prometheus Query Language (PromQL) Reference**. Consulted for rate calculation formulas, error percentage queries, and integration guidelines for Custom Metric APIs. [https://prometheus.io/docs/prometheus/latest/querying/basics/](https://prometheus.io/docs/prometheus/latest/querying/basics/)

6. **Next.js Developer Documentation**. Consulted for static export options (`output: "export"`), layout routing, React Server Components vs Client Components, and performance optimization. [https://nextjs.org/docs](https://nextjs.org/docs)

7. **React Official Documentation**. Referenced for `useState`, `useEffect` for playground state intervals, component lifecycle, context APIs, and custom hook structures. [https://react.dev](https://react.dev)

8. **TypeScript Documentation**. Used for static type definitions, compiler options, utility types, and strict mode compliance across components. [https://www.typescriptlang.org/docs/](https://www.typescriptlang.org/docs/)

9. **Tailwind CSS v4 styling specifications**. Referenced for CSS variable integration, `@theme` directives, custom utility configurations, and light/dark color tokens. [https://tailwindcss.com/docs](https://tailwindcss.com/docs)

10. **Framer Motion API Reference**. Used for configuring keyframes, layout animations, exit transitions, and performance optimizations within active page animations. [https://www.framer.com/motion/](https://www.framer.com/motion/)

11. **Nginx Ingress Controller ConfigMap Options**. Consulted for dynamic configuration updates, rate-limiting variables (`limit_req_zone`), custom snippets, and IP blocking implementations. [https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/configmap/](https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/configmap/)

12. **Helm Charts Guide**. Used for chart templates, helper templates (`_helpers.tpl`), default values definitions, chart packaging, and validation testing. [https://helm.sh/docs/chart_template_guide/](https://helm.sh/docs/chart_template_guide/)

13. **Cloudflare Pages & Wrangler CLI Reference**. Used for configuring static asset routing, continuous deployment pipelines, and wrangler deployment options. [https://developers.cloudflare.com/pages/](https://developers.cloudflare.com/pages/)

14. **OWASP Top 10 Web Application Security Risks**. Referenced to design filters targeting Denial of Service (DoS), SQL / Command Injection detection, and secure log management practices. [https://owasp.org/www-project-top-ten/](https://owasp.org/www-project-top-ten/)

15. **NIST Special Publication 800-92 – Guide to Computer Security Log Management**. Foundational standards for secure log generation, storage, transmission, and analysis policies. [https://csrc.nist.gov/publications/detail/sp/800-92/final](https://csrc.nist.gov/publications/detail/sp/800-92/final)

16. **Kubernetes client-go library**. Technical specification for Go programming models used to watch resource status changes, trigger updates, and handle API retries in controller loops. [https://github.com/kubernetes/client-go](https://github.com/kubernetes/client-go)

17. **Lucide React Icons**. Used as the visual library for responsive dashboard interfaces, status indicators, and interactive documentation icons. [https://lucide.dev/docs/lucide-react](https://lucide.dev/docs/lucide-react)

18. **Radix UI Primitives & shadcn/ui Component Registry**. Guidelines for accessible, modular, styled-base component construction. [https://ui.shadcn.com](https://ui.shadcn.com)

19. **RFC 7230 – Hypertext Transfer Protocol (HTTP/1.1): Message Syntax and Routing**. Protocol definitions referenced for log parsing of incoming requests and status code behaviors. [https://datatracker.ietf.org/doc/html/rfc7230](https://datatracker.ietf.org/doc/html/rfc7230)

20. **W3C Web Accessibility Initiative (WAI-ARIA) Guidelines**. Consulted to verify accessibility compliance, focus states, and aria landmarks on dashboard widgets. [https://www.w3.org/WAI/standards-guidelines/aria/](https://www.w3.org/WAI/standards-guidelines/aria/)

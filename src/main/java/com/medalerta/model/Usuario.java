package com.medalerta.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "Usuario")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idUsuario")
    private Integer idUsuario;

    private String nome;
    private String telefone;
    private String email;

    @Column(name = "enderecoRua")
    private String enderecoRua;

    @Column(name = "enderecoNumero")
    private Integer enderecoNumero;

    @Column(name = "enderecoComplemento")
    private String enderecoComplemento;

    @Column(name = "enderecoBairro")
    private String enderecoBairro;

    @Column(name = "enderecoCEP")
    private String enderecoCEP;

    @Column(name = "enderecoCidade")
    private String enderecoCidade;

    @Column(name = "enderecoEstado")
    private String enderecoEstado;
}
